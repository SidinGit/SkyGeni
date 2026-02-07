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

        // 1. Stale Deals: Open deals older than 60 days with no recent activity
        const staleDeals = await prisma.deal.findMany({
            where: {
                stage: {
                    notIn: ['Closed Won', 'Closed Lost'],
                },
                created_at: {
                    lt: sixtyDaysAgo,
                },
            },
            include: {
                account: true,
                rep: true,
                activities: {
                    where: {
                        timestamp: {
                            gte: thirtyDaysAgo,
                        },
                    },
                },
            },
        });

        const staleDealsFiltered = staleDeals
            .filter((deal) => deal.activities.length === 0)
            .map((deal) => ({
                dealId: deal.deal_id,
                accountName: deal.account.name,
                repName: deal.rep.name,
                amount: deal.amount,
                stage: deal.stage,
                daysSinceCreated: Math.floor(
                    (today.getTime() - deal.created_at.getTime()) / (1000 * 60 * 60 * 24)
                ),
            }));

        // 2. Underperforming Reps: Below average win rate
        const repStats = await prisma.deal.groupBy({
            by: ['rep_id'],
            where: {
                stage: {
                    in: ['Closed Won', 'Closed Lost'],
                },
            },
            _count: {
                deal_id: true,
            },
        });

        const repWinCounts = await prisma.deal.groupBy({
            by: ['rep_id'],
            where: {
                stage: 'Closed Won',
            },
            _count: {
                deal_id: true,
            },
        });

        const repWinMap = new Map(repWinCounts.map((r) => [r.rep_id, r._count.deal_id]));

        const repWinRates = repStats.map((r) => ({
            repId: r.rep_id,
            totalClosed: r._count.deal_id,
            wins: repWinMap.get(r.rep_id) || 0,
            winRate: ((repWinMap.get(r.rep_id) || 0) / r._count.deal_id) * 100,
        }));

        const avgWinRate = repWinRates.length > 0
            ? repWinRates.reduce((sum: number, r) => sum + r.winRate, 0) / repWinRates.length
            : 0;

        const underperformingReps = await Promise.all(
            repWinRates
                .filter((r) => r.winRate < avgWinRate && r.totalClosed >= 5)
                .map(async (r) => {
                    const rep = await prisma.rep.findUnique({ where: { rep_id: r.repId } });
                    return {
                        repId: r.repId,
                        repName: rep?.name || 'Unknown',
                        winRate: Math.round(r.winRate * 100) / 100,
                        avgWinRate: Math.round(avgWinRate * 100) / 100,
                        gapFromAvg: Math.round((avgWinRate - r.winRate) * 100) / 100,
                    };
                })
        );

        // 3. Low Activity Accounts: Accounts with < 2 activities in last 30 days
        const accountActivityCounts = await prisma.activity.groupBy({
            by: ['deal_id'],
            where: {
                timestamp: {
                    gte: thirtyDaysAgo,
                },
            },
            _count: {
                activity_id: true,
            },
        });

        const dealToAccountMap = await prisma.deal.findMany({
            where: {
                stage: {
                    notIn: ['Closed Won', 'Closed Lost'],
                },
            },
            include: {
                account: true,
            },
        });

        const accountActivityMap = new Map<string, number>();
        for (const deal of dealToAccountMap) {
            const activityCount = accountActivityCounts.find((a) => a.deal_id === deal.deal_id)?._count.activity_id || 0;
            const current = accountActivityMap.get(deal.account_id) || 0;
            accountActivityMap.set(deal.account_id, current + activityCount);
        }

        const lowActivityAccounts: Array<{
            accountId: string;
            accountName: string;
            segment: string;
            activityCount: number;
        }> = [];

        for (const [accountId, count] of accountActivityMap) {
            if (count < 2) {
                const account = await prisma.account.findUnique({ where: { account_id: accountId } });
                if (account) {
                    lowActivityAccounts.push({
                        accountId,
                        accountName: account.name,
                        segment: account.segment,
                        activityCount: count,
                    });
                }
            }
        }

        res.json({
            staleDeals: staleDealsFiltered.slice(0, 10), // Top 10
            underperformingReps: underperformingReps.sort((a, b) => a.winRate - b.winRate).slice(0, 5),
            lowActivityAccounts: lowActivityAccounts.slice(0, 10),
            summary: {
                totalStaleDeals: staleDealsFiltered.length,
                totalUnderperformingReps: underperformingReps.length,
                totalLowActivityAccounts: lowActivityAccounts.length,
            },
        });
    } catch (error) {
        console.error('Error fetching risk factors:', error);
        res.status(500).json({ error: 'Failed to fetch risk factors' });
    }
};
