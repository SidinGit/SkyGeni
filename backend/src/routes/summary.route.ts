import { Router } from 'express';
import { getSummary } from '../controllers/summary.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/summary:
 *   get:
 *     summary: Get quarterly revenue summary
 *     tags: [Summary]
 *     description: Returns current quarter revenue, target, gap percentage, and QoQ change
 *     responses:
 *       200:
 *         description: Revenue summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentQuarter:
 *                   type: string
 *                   example: "Q4 2025"
 *                 revenue:
 *                   type: number
 *                   example: 743460
 *                 target:
 *                   type: number
 *                   example: 630855
 *                 gapPercentage:
 *                   type: number
 *                   example: 17.85
 *                 qoqChange:
 *                   type: number
 *                   example: 122.9
 *                 status:
 *                   type: string
 *                   enum: [ahead, behind]
 *                   example: "ahead"
 *       500:
 *         description: Server error
 */
router.get('/', getSummary);

export default router;
