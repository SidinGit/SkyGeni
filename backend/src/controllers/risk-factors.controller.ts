import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/risk-factors
 * Returns: Stale deals, Underperforming reps, Low activity accounts
 */
export const getRiskFactors = async (_req: Request, res: Response): Promise<void> => {
    try {
        const today = new Date('2025-12-31'); // Simulated "current date"
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(today);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // 1. Stale Deals: Optimized with single query
        const staleDeals = await prisma.deal.findMany({
            where: {
                stage: { notIn: ['Closed Won', 'Closed Lost'] },
                created_at: { lt: sixtyDaysAgo },
                activities: {
                    none: {
                        timestamp: { gte: thirtyDaysAgo }
                    }
                }
            },
            include: {
                account: true,
                rep: true,
            },
            take: 20 // Limit to prevent massive payloads
        });

        const staleDealsFormatted = staleDeals.map((deal) => ({
            dealId: deal.deal_id,
            accountName: deal.account.name,
            repName: deal.rep.name,
            amount: deal.amount,
            stage: deal.stage,
            daysSinceCreated: Math.floor(
                (today.getTime() - deal.created_at.getTime()) / (1000 * 60 * 60 * 24)
            ),
        }));

        // 2. Underperforming Reps: Optimized to avoid N+1
        const [repStats, repWinCounts, allReps] = await Promise.all([
            prisma.deal.groupBy({
                by: ['rep_id'],
                where: { stage: { in: ['Closed Won', 'Closed Lost'] } },
                _count: { deal_id: true },
            }),
            prisma.deal.groupBy({
                by: ['rep_id'],
                where: { stage: 'Closed Won' },
                _count: { deal_id: true },
            }),
            prisma.rep.findMany() // Fetch ALL reps once
        ]);

        const repMap = new Map(allReps.map(r => [r.rep_id, r.name]));
        const repWinMap = new Map(repWinCounts.map((r) => [r.rep_id, r._count.deal_id]));

        const repWinRates = repStats.map((r) => {
            const wins = repWinMap.get(r.rep_id) || 0;
            const total = r._count.deal_id;
            return {
                repId: r.rep_id,
                repName: repMap.get(r.rep_id) || 'Unknown',
                winRate: (wins / total) * 100,
                totalClosed: total
            };
        });

        const avgWinRate = repWinRates.length > 0
            ? repWinRates.reduce((sum, r) => sum + r.winRate, 0) / repWinRates.length
            : 0;

        const underperformingReps = repWinRates
            .filter((r) => r.winRate < avgWinRate && r.totalClosed >= 5)
            .map(r => ({
                repId: r.repId,
                repName: r.repName,
                winRate: Math.round(r.winRate * 100) / 100,
                avgWinRate: Math.round(avgWinRate * 100) / 100,
                gapFromAvg: Math.round((avgWinRate - r.winRate) * 100) / 100,
            }))
            .sort((a, b) => a.winRate - b.winRate)
            .slice(0, 5);

        // 3. Low Activity Accounts: Optimized
        // Fetch all open deals with their accounts and activity counts in one go if possible, 
        // but Prisma doesn't do deep aggregation easily. 
        // Better approach: Fetch all open deals + accounts, then fetch activities for those deals in batch.

        const openDeals = await prisma.deal.findMany({
            where: { stage: { notIn: ['Closed Won', 'Closed Lost'] } },
            select: { deal_id: true, account_id: true, account: { select: { name: true, segment: true } } }
        });

        const openDealIds = openDeals.map(d => d.deal_id);

        // Batch fetch activity counts for these deals
        const recentActivities = await prisma.activity.groupBy({
            by: ['deal_id'],
            where: {
                deal_id: { in: openDealIds },
                timestamp: { gte: thirtyDaysAgo }
            },
            _count: { activity_id: true }
        });

        const activityCountMap = new Map(recentActivities.map(a => [a.deal_id, a._count.activity_id]));

        const accountActivityMap = new Map<string, { name: string, segment: string, count: number }>();

        for (const deal of openDeals) {
            const count = activityCountMap.get(deal.deal_id) || 0;
            const existing = accountActivityMap.get(deal.account_id);
            if (existing) {
                existing.count += count;
            } else {
                accountActivityMap.set(deal.account_id, {
                    name: deal.account.name,
                    segment: deal.account.segment,
                    count
                });
            }
        }

        const lowActivityAccounts = Array.from(accountActivityMap.entries())
            .filter(([_, data]) => data.count < 2)
            .map(([accountId, data]) => ({
                accountId,
                accountName: data.name,
                segment: data.segment,
                activityCount: data.count
            }))
            .slice(0, 10);

        res.json({
            staleDeals: staleDealsFormatted,
            underperformingReps,
            lowActivityAccounts,
            summary: {
                totalStaleDeals: staleDealsFormatted.length,
                totalUnderperformingReps: underperformingReps.length,
                totalLowActivityAccounts: lowActivityAccounts.length,
            },
        });
    } catch (error) {
        console.error('Error fetching risk factors:', error);
        res.status(500).json({ error: 'Failed to fetch risk factors' });
    }
};
