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

        // 2. Underperforming Reps: Database Level Calculation
        // Calculate Win Rate for each rep and filter those below average
        const underperformingReps = await prisma.$queryRaw<Array<{
            repId: string;
            repName: string;
            winRate: number;
            totalClosed: bigint;
            avgWinRate: number;
        }>>`
            WITH RepStats AS (
                SELECT 
                    r.rep_id,
                    r.name,
                    COUNT(d.deal_id) FILTER (WHERE d.stage = 'Closed Won') as wins,
                    COUNT(d.deal_id) as total,
                    CASE 
                        WHEN COUNT(d.deal_id) > 0 
                        THEN (COUNT(d.deal_id) FILTER (WHERE d.stage = 'Closed Won')::FLOAT / COUNT(d.deal_id)::FLOAT) * 100 
                        ELSE 0 
                    END as win_rate
                FROM "Rep" r
                JOIN "Deal" d ON r.rep_id = d.rep_id
                WHERE d.stage IN ('Closed Won', 'Closed Lost')
                GROUP BY r.rep_id, r.name
                HAVING COUNT(d.deal_id) >= 5
            ),
            GlobalStats AS (
                SELECT AVG(win_rate) as global_avg 
                FROM RepStats
            )
            SELECT 
                rs.rep_id as "repId",
                rs.name as "repName",
                rs.win_rate as "winRate",
                rs.total as "totalClosed",
                gs.global_avg as "avgWinRate"
            FROM RepStats rs, GlobalStats gs
            WHERE rs.win_rate < gs.global_avg
            ORDER BY rs.win_rate ASC
            LIMIT 5;
        `;

        const formattedReps = underperformingReps.map(r => ({
            repId: r.repId,
            repName: r.repName,
            winRate: Math.round(Number(r.winRate) * 100) / 100,
            avgWinRate: Math.round(Number(r.avgWinRate) * 100) / 100,
            gapFromAvg: Math.round((Number(r.avgWinRate) - Number(r.winRate)) * 100) / 100
        }));

        // 3. Low Activity Accounts: Database Level Aggregation
        // Find accounts with < 2 activities in last 30 days on their open deals
        const lowActivityAccountsRaw = await prisma.$queryRaw<Array<{
            accountId: string;
            accountName: string;
            segment: string;
            activityCount: bigint;
        }>>`
            SELECT 
                a.account_id as "accountId",
                a.name as "accountName",
                a.segment,
                COUNT(act.activity_id) as "activityCount"
            FROM "Account" a
            JOIN "Deal" d ON a.account_id = d.account_id
            LEFT JOIN "Activity" act ON d.deal_id = act.deal_id AND act.timestamp >= ${thirtyDaysAgo}
            WHERE d.stage NOT IN ('Closed Won', 'Closed Lost')
            GROUP BY a.account_id, a.name, a.segment
            HAVING COUNT(act.activity_id) < 2
            LIMIT 10;
        `;

        const lowActivityAccounts = lowActivityAccountsRaw.map(a => ({
            accountId: a.accountId,
            accountName: a.accountName,
            segment: a.segment,
            activityCount: Number(a.activityCount)
        }));

        res.json({
            staleDeals: staleDealsFormatted.slice(0, 10), // Top 10
            underperformingReps: formattedReps,
            lowActivityAccounts: lowActivityAccounts,
            summary: {
                totalStaleDeals: staleDealsFormatted.length,
                totalUnderperformingReps: formattedReps.length,
                totalLowActivityAccounts: lowActivityAccounts.length,
            },
        });
    } catch (error) {
        console.error('Error fetching risk factors:', error);
        res.status(500).json({ error: 'Failed to fetch risk factors' });
    }
};
