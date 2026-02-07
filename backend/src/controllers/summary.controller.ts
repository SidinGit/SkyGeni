import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/summary
 * Returns: Current Quarter Revenue, Target, Gap %, QoQ change
 * PLUS: 6-month revenue trend for the main chart
 */
export const getSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Simulation Date: Dec 31, 2025
        const today = new Date('2025-12-31');

        // Q4 2025: Oct 1 - Dec 31
        const q4Start = new Date('2025-10-01');
        const q4End = new Date('2025-12-31');

        // Q3 2025: Jul 1 - Sep 30
        const q3Start = new Date('2025-07-01');
        const q3End = new Date('2025-09-30');

        // Current Quarter Revenue (Closed Won deals in Q4)
        const q4Revenue = await prisma.deal.aggregate({
            _sum: { amount: true },
            where: {
                stage: 'Closed Won',
                closed_at: { gte: q4Start, lte: q4End },
            },
        });

        // Previous Quarter Revenue (Q3) for QoQ comparison
        const q3Revenue = await prisma.deal.aggregate({
            _sum: { amount: true },
            where: {
                stage: 'Closed Won',
                closed_at: { gte: q3Start, lte: q3End },
            },
        });

        // Get Q4 monthly targets
        const q4Targets = await prisma.target.findMany({
            where: { month: { in: ['2025-10', '2025-11', '2025-12'] } },
        });

        const currentRevenue = q4Revenue._sum.amount || 0;
        const previousRevenue = q3Revenue._sum.amount || 0;
        const quarterTarget = q4Targets.reduce((sum: number, t) => sum + t.target, 0);

        // Gap calculation
        const gapPercentage = quarterTarget > 0
            ? ((currentRevenue - quarterTarget) / quarterTarget) * 100
            : 0;

        // QoQ change
        const qoqChange = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
            : 0;

        res.json({
            currentQuarter: 'Q4 2025',
            revenue: currentRevenue,
            target: quarterTarget,
            gapPercentage: Math.round(gapPercentage * 100) / 100,
            qoqChange: Math.round(qoqChange * 100) / 100,
            status: gapPercentage >= 0 ? 'ahead' : 'behind',
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
};
