import { Router } from 'express';
import { getRiskFactors } from '../controllers/risk-factors.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/risk-factors:
 *   get:
 *     summary: Get risk factors
 *     tags: [Risk Factors]
 *     description: Identifies stale deals, underperforming reps, and low activity accounts
 *     responses:
 *       200:
 *         description: Risk factor analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staleDeals:
 *                   type: array
 *                   description: Deals open > 60 days with no recent activity
 *                   items:
 *                     type: object
 *                     properties:
 *                       dealId:
 *                         type: string
 *                       accountName:
 *                         type: string
 *                       repName:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       stage:
 *                         type: string
 *                       daysSinceCreated:
 *                         type: integer
 *                 underperformingReps:
 *                   type: array
 *                   description: Reps with below-average win rate
 *                   items:
 *                     type: object
 *                     properties:
 *                       repId:
 *                         type: string
 *                       repName:
 *                         type: string
 *                       winRate:
 *                         type: number
 *                       avgWinRate:
 *                         type: number
 *                       gapFromAvg:
 *                         type: number
 *                 lowActivityAccounts:
 *                   type: array
 *                   description: Accounts with < 2 activities in last 30 days
 *                   items:
 *                     type: object
 *                     properties:
 *                       accountId:
 *                         type: string
 *                       accountName:
 *                         type: string
 *                       segment:
 *                         type: string
 *                       activityCount:
 *                         type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalStaleDeals:
 *                       type: integer
 *                     totalUnderperformingReps:
 *                       type: integer
 *                     totalLowActivityAccounts:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/', getRiskFactors);

export default router;
