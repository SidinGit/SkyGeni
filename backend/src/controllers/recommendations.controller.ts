import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Recommendation {
    id: number;
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: string;
}

/**
 * GET /api/recommendations
 * Returns: 3-5 actionable suggestions based on data analysis
 */
export const getRecommendations = async (_req: Request, res: Response): Promise<void> => {
    try {
        const recommendations: Recommendation[] = [];

        const today = new Date('2025-12-31');
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Check for Enterprise deals older than 30 days in pipeline
        const oldEnterpriseDeals = await prisma.deal.count({
            where: {
                stage: {
                    notIn: ['Closed Won', 'Closed Lost'],
                },
                created_at: {
                    lt: thirtyDaysAgo,
                },
                account: {
                    segment: 'Enterprise',
                },
            },
        });

        if (oldEnterpriseDeals > 0) {
            recommendations.push({
                id: 1,
                priority: 'high',
                category: 'Pipeline',
                title: `Focus on ${oldEnterpriseDeals} Enterprise deals older than 30 days`,
                description: 'Enterprise deals have longer cycles but higher value. Prioritize moving these forward.',
                impact: 'High potential revenue recovery',
            });
        }

        // 2. Find reps with low win rate to coach
        const repStats = await prisma.deal.groupBy({
            by: ['rep_id'],
            where: { stage: { in: ['Closed Won', 'Closed Lost'] } },
            _count: { deal_id: true },
        });

        const repWinCounts = await prisma.deal.groupBy({
            by: ['rep_id'],
            where: { stage: 'Closed Won' },
            _count: { deal_id: true },
        });

        const winMap = new Map(repWinCounts.map((r) => [r.rep_id, r._count.deal_id]));
        const repsToCoach = repStats
            .filter((r) => r._count.deal_id >= 5)
            .map((r) => ({
                repId: r.rep_id,
                winRate: ((winMap.get(r.rep_id) || 0) / r._count.deal_id) * 100,
            }))
            .filter((r) => r.winRate < 40)
            .sort((a, b) => a.winRate - b.winRate);

        if (repsToCoach.length > 0) {
            const rep = await prisma.rep.findUnique({ where: { rep_id: repsToCoach[0].repId } });
            recommendations.push({
                id: 2,
                priority: 'high',
                category: 'Coaching',
                title: `Coach ${rep?.name || 'Rep'} on win rate (${Math.round(repsToCoach[0].winRate)}%)`,
                description: 'This rep has the lowest win rate among those with sufficient deals. Focus on deal qualification and objection handling.',
                impact: 'Improve conversion by 10-15%',
            });
        }

        // 3. Identify segments with low activity
        const segmentActivity = await prisma.$queryRaw<Array<{ segment: string; activity_count: bigint }>>`
      SELECT a.segment, COUNT(act.activity_id) as activity_count
      FROM "Account" a
      JOIN "Deal" d ON a.account_id = d.account_id
      LEFT JOIN "Activity" act ON d.deal_id = act.deal_id AND act.timestamp >= ${thirtyDaysAgo}
      WHERE d.stage NOT IN ('Closed Won', 'Closed Lost')
      GROUP BY a.segment
      ORDER BY activity_count ASC
    `;

        if (segmentActivity.length > 0) {
            const lowestSegment = segmentActivity[0];
            recommendations.push({
                id: 3,
                priority: 'medium',
                category: 'Activity',
                title: `Increase activity for ${lowestSegment.segment} segment`,
                description: `${lowestSegment.segment} has the lowest engagement in the last 30 days. Schedule more touchpoints.`,
                impact: 'Improve pipeline velocity',
            });
        }

        // 4. Check for deals stuck in Negotiation
        const stuckNegotiation = await prisma.deal.count({
            where: {
                stage: 'Negotiation',
                created_at: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        if (stuckNegotiation > 3) {
            recommendations.push({
                id: 4,
                priority: 'medium',
                category: 'Pipeline',
                title: `Unblock ${stuckNegotiation} deals stuck in Negotiation`,
                description: 'Multiple deals have been in negotiation for over 30 days. Consider offering incentives or escalating.',
                impact: 'Accelerate close timing',
            });
        }

        // 5. Highlight high-value pipeline at risk
        const highValueAtRisk = await prisma.deal.aggregate({
            _sum: { amount: true },
            _count: true,
            where: {
                stage: 'Prospecting',
                amount: { gte: 50000 },
                created_at: { lt: thirtyDaysAgo },
            },
        });

        if ((highValueAtRisk._count || 0) > 0) {
            recommendations.push({
                id: 5,
                priority: 'high',
                category: 'Pipeline',
                title: `Accelerate ${highValueAtRisk._count} high-value deals ($${((highValueAtRisk._sum.amount || 0) / 1000).toFixed(0)}k)`,
                description: 'Large deals in early stages are at risk of going cold. Prioritize executive engagement.',
                impact: 'Protect major revenue opportunities',
            });
        }

        // Ensure we always have at least 3 recommendations
        if (recommendations.length < 3) {
            recommendations.push({
                id: recommendations.length + 1,
                priority: 'low',
                category: 'General',
                title: 'Review weekly pipeline hygiene',
                description: 'Regular pipeline reviews help identify and address issues early.',
                impact: 'Maintain forecast accuracy',
            });
        }

        res.json({
            recommendations: recommendations.slice(0, 5),
            generatedAt: today.toISOString(),
        });
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
};
