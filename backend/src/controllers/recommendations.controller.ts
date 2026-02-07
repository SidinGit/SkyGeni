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
        const today = new Date('2025-12-31');
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Run all independent checks in parallel
        const [
            oldEnterpriseDeals,
            repWinRates,
            segmentActivity,
            stuckNegotiation,
            highValueAtRisk
        ] = await Promise.all([
            // 1. Old Enterprise Deals
            prisma.deal.count({
                where: {
                    stage: { notIn: ['Closed Won', 'Closed Lost'] },
                    created_at: { lt: thirtyDaysAgo },
                    account: { segment: 'Enterprise' },
                },
            }),
            // 2. Low Win Rate Reps (SQL Optimization)
            prisma.$queryRaw<Array<{ repId: string; repName: string; winRate: number; total: bigint }>>`
                SELECT r.rep_id as "repId", r.name as "repName",
                (COUNT(d.deal_id) FILTER (WHERE d.stage='Closed Won')::FLOAT / COUNT(d.deal_id)::FLOAT) * 100 as "winRate",
                COUNT(d.deal_id) as total
                FROM "Rep" r
                JOIN "Deal" d ON r.rep_id = d.rep_id
                WHERE d.stage IN ('Closed Won', 'Closed Lost')
                GROUP BY r.rep_id, r.name
                HAVING COUNT(d.deal_id) >= 5 AND (COUNT(d.deal_id) FILTER (WHERE d.stage='Closed Won')::FLOAT / COUNT(d.deal_id)::FLOAT) < 0.4
                ORDER BY "winRate" ASC
                LIMIT 1
            `,
            // 3. Low Activity Segments
            prisma.$queryRaw<Array<{ segment: string; activity_count: bigint }>>`
                SELECT a.segment, COUNT(act.activity_id) as activity_count
                FROM "Account" a
                JOIN "Deal" d ON a.account_id = d.account_id
                LEFT JOIN "Activity" act ON d.deal_id = act.deal_id AND act.timestamp >= ${thirtyDaysAgo}
                WHERE d.stage NOT IN ('Closed Won', 'Closed Lost')
                GROUP BY a.segment
                ORDER BY activity_count ASC
                LIMIT 1
            `,
            // 4. Stuck Negotiation
            prisma.deal.count({
                where: {
                    stage: 'Negotiation',
                    created_at: { lt: thirtyDaysAgo },
                },
            }),
            // 5. High Value At Risk
            prisma.deal.aggregate({
                _sum: { amount: true },
                _count: true,
                where: {
                    stage: 'Prospecting',
                    amount: { gte: 50000 },
                    created_at: { lt: thirtyDaysAgo },
                },
            })
        ]);

        const recommendations: Recommendation[] = [];

        // 1. Enterprise Deals
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

        // 2. Rep Coaching
        if (repWinRates.length > 0) {
            const rep = repWinRates[0];
            recommendations.push({
                id: 2,
                priority: 'high',
                category: 'Coaching',
                title: `Coach ${rep.repName} on win rate (${Math.round(Number(rep.winRate))}%)`,
                description: 'This rep has the lowest win rate among those with sufficient deals. Focus on deal qualification and objection handling.',
                impact: 'Improve conversion by 10-15%',
            });
        }

        // 3. Segment Activity
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

        // 4. Stuck Negotiation
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

        // 5. At Risk
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

        // Fallback
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
