import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to calculate trends using database aggregation
const getTrends = async () => {
    // 12-month buckets
    const today = new Date();

    // 1. Win Rate, Deal Size, Cycle Time (Closed Deals) - via SQL
    const closedTrends = await prisma.$queryRaw<Array<{
        month_key: string;
        won_count: bigint;
        total_closed: bigint;
        avg_size: number | null;
        avg_days: number | null;
    }>>`
        SELECT 
            to_char(closed_at, 'YYYY-MM') as month_key,
            COUNT(*) FILTER (WHERE stage = 'Closed Won') as won_count,
            COUNT(*) as total_closed,
            AVG(amount) FILTER (WHERE stage = 'Closed Won') as avg_size,
            AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400) FILTER (WHERE stage = 'Closed Won') as avg_days
        FROM "Deal"
        WHERE closed_at >= NOW() - INTERVAL '12 months'
        GROUP BY 1
        ORDER BY 1
    `;

    // 2. Pipeline Trend (Complex Point-in-time calculation)
    // We still need to fetch minimal data for this, but can optimize.
    // Fetch only deals created before today and (open OR closed in last 12 months)
    const pipelineDeals = await prisma.deal.findMany({
        where: {
            OR: [
                { stage: { notIn: ['Closed Won', 'Closed Lost'] } },
                { closed_at: { gte: new Date(today.getFullYear(), today.getMonth() - 12, 1) } }
            ]
        },
        select: { created_at: true, closed_at: true, amount: true, stage: true }
    });

    const trends = {
        pipelineTrend: [] as number[],
        winRateTrend: [] as number[],
        dealSizeTrend: [] as number[],
        salesCycleTrend: [] as number[]
    };

    const buckets = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        buckets.push({
            monthStart: d,
            monthEnd: new Date(d.getFullYear(), d.getMonth() + 1, 0),
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
        });
    }

    const closedMap = new Map(closedTrends.map(t => [t.month_key, t]));

    buckets.forEach(bucket => {
        // Pipeline: Sum of deals OPEN at monthEnd
        const pipelineVal = pipelineDeals.reduce((sum, deal) => {
            const created = deal.created_at <= bucket.monthEnd;
            const notClosedYet = !deal.closed_at || deal.closed_at > bucket.monthEnd;
            // Note: If deal was lost/won BEFORE bucket end, it's not in pipeline.
            // If it was created AFTER bucket end, it's not in pipeline.
            if (created && notClosedYet) {
                // Exclude if it was already closed lost/won way before (logic check)
                // Our query filters closed_at gte 12 months, so effectively handles recent history.
                // For simplified logic: Open status check isn't stored historically, so we rely on dates.
                return sum + (deal.amount || 0);
            }
            return sum;
        }, 0);
        trends.pipelineTrend.push(pipelineVal);

        // Closed Metrics from SQL
        const stats = closedMap.get(bucket.key);
        if (stats) {
            const wins = Number(stats.won_count);
            const total = Number(stats.total_closed);
            trends.winRateTrend.push(total > 0 ? (wins / total) * 100 : 0);
            trends.dealSizeTrend.push(Number(stats.avg_size || 0));
            trends.salesCycleTrend.push(Number(stats.avg_days || 0));
        } else {
            trends.winRateTrend.push(0);
            trends.dealSizeTrend.push(0);
            trends.salesCycleTrend.push(0);
        }
    });

    return trends;
};

export const getDrivers = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Parallelize independent queries
        const [pipeline, closedStats, avgDealSize, cycleTimeResult, trends] = await Promise.all([
            // 1. Pipeline Size (Open)
            prisma.deal.aggregate({
                _sum: { amount: true },
                _count: true,
                where: { stage: { notIn: ['Closed Won', 'Closed Lost'] } },
            }),
            // 2. Win Rate Stats
            prisma.deal.groupBy({
                by: ['stage'],
                _count: { deal_id: true }
            }),
            // 3. Avg Deal Size (Won)
            prisma.deal.aggregate({
                _avg: { amount: true },
                where: { amount: { not: null }, stage: 'Closed Won' },
            }),
            // 4. Avg Sales Cycle (SQL for speed)
            prisma.$queryRaw<Array<{ avg_days: number | null }>>`
                SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400) as avg_days
                FROM "Deal"
                WHERE stage = 'Closed Won' AND closed_at IS NOT NULL
            `,
            // 5. Trends
            getTrends()
        ]);

        const closedWon = closedStats.find(s => s.stage === 'Closed Won')?._count.deal_id || 0;
        const closedLost = closedStats.find(s => s.stage === 'Closed Lost')?._count.deal_id || 0;
        const totalClosed = closedWon + closedLost;
        const winRate = totalClosed > 0 ? (closedWon / totalClosed) * 100 : 0;
        const avgCycleTime = cycleTimeResult[0]?.avg_days || 0;

        res.json({
            pipelineSize: pipeline._sum.amount || 0,
            pipelineCount: pipeline._count,
            winRate: Math.round(winRate * 100) / 100,
            avgDealSize: Math.round(avgDealSize._avg.amount || 0),
            avgSalesCycleTime: Math.round(Number(avgCycleTime)),
            closedWonCount: closedWon,
            closedLostCount: closedLost,
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
