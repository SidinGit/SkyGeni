import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to calculate trends for the last 12 months
const calculateTrends = async () => {
    const today = new Date();
    const trends = {
        pipelineTrend: [] as number[],
        winRateTrend: [] as number[],
        dealSizeTrend: [] as number[],
        salesCycleTrend: [] as number[]
    };

    // simplified: fetch all relevant data once
    const deals = await prisma.deal.findMany({
        select: {
            amount: true,
            stage: true,
            created_at: true,
            closed_at: true
        }
    });

    // Generate buckets for last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // 1. Pipeline Size at end of month: Created before end, Not closed OR closed after end
        const pipelineValue = deals
            .filter(d =>
                d.created_at <= monthEnd &&
                (d.stage !== 'Closed Won' && d.stage !== 'Closed Lost' ? true : (d.closed_at && d.closed_at > monthEnd))
            )
            .reduce((sum, d) => sum + (d.amount || 0), 0);

        trends.pipelineTrend.push(pipelineValue);

        // For closed metrics, consider deals closed in this bucket
        const closedInMonth = deals.filter(d =>
            d.closed_at && d.closed_at >= monthStart && d.closed_at <= monthEnd &&
            (d.stage === 'Closed Won' || d.stage === 'Closed Lost')
        );

        const wonInMonth = closedInMonth.filter(d => d.stage === 'Closed Won');

        // 2. Win Rate
        const winRate = closedInMonth.length > 0
            ? (wonInMonth.length / closedInMonth.length) * 100
            : 0;
        trends.winRateTrend.push(winRate);

        // 3. Avg Deal Size (Won deals only)
        const totalDealValue = wonInMonth.reduce((sum, d) => sum + (d.amount || 0), 0);
        const avgSize = wonInMonth.length > 0 ? totalDealValue / wonInMonth.length : 0;
        trends.dealSizeTrend.push(avgSize);

        // 4. Sales Cycle (Avg days for deals won in this month)
        let totalDays = 0;
        wonInMonth.forEach(d => {
            if (d.created_at && d.closed_at) {
                const days = (d.closed_at.getTime() - d.created_at.getTime()) / (1000 * 60 * 60 * 24);
                totalDays += Math.max(0, days);
            }
        });
        const avgCycle = wonInMonth.length > 0 ? totalDays / wonInMonth.length : 0;
        trends.salesCycleTrend.push(avgCycle);
    }

    // Fill empty/zero trends (optional: could smooth data here, but raw is honest)
    return trends;
};

/**
 * GET /api/v1/drivers
 * Returns: Pipeline size, Win rate, Avg deal size, Sales cycle time
 * Plus: Historical trends for the last 12 months based on Deal data
 */
export const getDrivers = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Pipeline Size: Total value of open deals (not Closed Won/Lost)
        const pipeline = await prisma.deal.aggregate({
            _sum: { amount: true },
            _count: true,
            where: {
                stage: {
                    notIn: ['Closed Won', 'Closed Lost'],
                },
            },
        });

        // Win Rate: Closed Won / (Closed Won + Closed Lost)
        const closedWon = await prisma.deal.count({
            where: { stage: 'Closed Won' },
        });
        const closedLost = await prisma.deal.count({
            where: { stage: 'Closed Lost' },
        });
        const totalClosed = closedWon + closedLost;
        const winRate = totalClosed > 0 ? (closedWon / totalClosed) * 100 : 0;

        // Average Deal Size (only for deals with amount)
        const avgDealSize = await prisma.deal.aggregate({
            _avg: { amount: true },
            where: {
                amount: { not: null },
                stage: 'Closed Won',
            },
        });

        // Sales Cycle Time: Avg days from created_at to closed_at for Closed Won deals
        const closedDeals = await prisma.deal.findMany({
            where: {
                stage: 'Closed Won',
                closed_at: { not: null },
            },
            select: {
                created_at: true,
                closed_at: true,
            },
        });

        let avgCycleTime = 0;
        if (closedDeals.length > 0) {
            const totalDays = closedDeals.reduce((sum: number, deal) => {
                if (deal.closed_at) {
                    const days = Math.floor(
                        (deal.closed_at.getTime() - deal.created_at.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return sum + Math.max(0, days);
                }
                return sum;
            }, 0);
            avgCycleTime = totalDays / closedDeals.length;
        }

        // Calculate real historical trends from DB
        const trends = await calculateTrends();

        res.json({
            pipelineSize: pipeline._sum.amount || 0,
            pipelineCount: pipeline._count,
            winRate: Math.round(winRate * 100) / 100,
            avgDealSize: Math.round(avgDealSize._avg.amount || 0),
            avgSalesCycleTime: Math.round(avgCycleTime),
            closedWonCount: closedWon,
            closedLostCount: closedLost,
            // Dynamic Trends from DB
            pipelineTrend: trends.pipelineTrend,
            winRateTrend: trends.winRateTrend,
            dealSizeTrend: trends.dealSizeTrend,
            salesCycleTrend: trends.salesCycleTrend,
        });
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
};
