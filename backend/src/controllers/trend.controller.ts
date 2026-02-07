import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRevenueTrend = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Fetch all deals that are 'Closed Won'
        const deals = await prisma.deal.findMany({
            where: {
                stage: 'Closed Won',
                closed_at: { not: null }
            },
            select: {
                amount: true,
                closed_at: true
            },
            orderBy: {
                closed_at: 'asc'
            }
        });

        // Group by Month (YYYY-MM)
        const monthlyRevenue = deals.reduce((acc, deal) => {
            if (!deal.closed_at || !deal.amount) return acc;

            // Format: YYYY-MM
            const date = new Date(deal.closed_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });

            if (!acc[monthKey]) {
                acc[monthKey] = {
                    month: monthLabel, // e.g., "Jan 25"
                    rawDate: monthKey,
                    amount: 0
                };
            }
            acc[monthKey].amount += deal.amount;
            return acc;
        }, {} as Record<string, { month: string; rawDate: string; amount: number }>);

        // Convert to array and sort by date
        const revenueTrend = Object.values(monthlyRevenue)
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
            .map(item => ({
                month: item.month,
                amount: Math.round(item.amount)
            }));

        res.json(revenueTrend);
    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        res.status(500).json({ error: 'Failed to fetch revenue trend' });
    }
};
