import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRevenueTrend = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Optimize: Use Database Aggregation instead of loading all deals
        // Postgres: to_char(closed_at, 'YYYY-MM')
        const monthlyRevenue = await prisma.$queryRaw<Array<{ month_key: string; total_amount: number | bigint }>>`
            SELECT 
                to_char(closed_at, 'YYYY-MM') as month_key,
                SUM(amount) as total_amount
            FROM "Deal"
            WHERE stage = 'Closed Won' 
            AND closed_at IS NOT NULL
            GROUP BY to_char(closed_at, 'YYYY-MM')
            ORDER BY month_key ASC
        `;

        // Map to frontend format
        const revenueTrend = monthlyRevenue.map(item => {
            const date = new Date(item.month_key + '-01'); // Append day to parse
            return {
                month: date.toLocaleString('default', { month: 'short', year: '2-digit' }), // "Jan 25"
                amount: Math.round(Number(item.total_amount)) // Handle BigInt
            };
        });

        res.json(revenueTrend);
    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        res.status(500).json({ error: 'Failed to fetch revenue trend' });
    }
};
