import { Router } from 'express';
import { getRevenueTrend } from '../controllers/trend.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/trend:
 *   get:
 *     summary: Get historical revenue trend
 *     tags: [Trend]
 *     description: Returns monthly revenue for all 'Closed Won' deals, sorted chronologically.
 *     responses:
 *       200:
 *         description: List of monthly revenue data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:
 *                     type: string
 *                     description: Formatted month label (e.g., "Jan 25")
 *                     example: "Jan 25"
 *                   amount:
 *                     type: number
 *                     description: Total revenue for the month
 *                     example: 54000
 *       500:
 *         description: Server error
 */
router.get('/', getRevenueTrend);

export default router;
