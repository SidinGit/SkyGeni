import { Router } from 'express';
import { getDrivers } from '../controllers/drivers.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/drivers:
 *   get:
 *     summary: Get revenue drivers
 *     tags: [Drivers]
 *     description: Returns pipeline size, win rate, average deal size, and sales cycle time
 *     responses:
 *       200:
 *         description: Revenue driver metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pipelineSize:
 *                   type: number
 *                   description: Total value of open deals
 *                   example: 6365441
 *                 pipelineCount:
 *                   type: integer
 *                   description: Number of open deals
 *                   example: 299
 *                 winRate:
 *                   type: number
 *                   description: Percentage of deals won
 *                   example: 50.5
 *                 avgDealSize:
 *                   type: number
 *                   description: Average value of closed won deals
 *                   example: 38500
 *                 avgSalesCycleTime:
 *                   type: integer
 *                   description: Average days to close a deal
 *                   example: 47
 *                 closedWonCount:
 *                   type: integer
 *                   example: 152
 *                 closedLostCount:
 *                   type: integer
 *                   example: 149
 *       500:
 *         description: Server error
 */
router.get('/', getDrivers);

export default router;
