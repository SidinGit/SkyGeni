import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendations.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/recommendations:
 *   get:
 *     summary: Get actionable recommendations
 *     tags: [Recommendations]
 *     description: Returns 3-5 actionable suggestions based on data analysis
 *     responses:
 *       200:
 *         description: List of recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       priority:
 *                         type: string
 *                         enum: [high, medium, low]
 *                       category:
 *                         type: string
 *                         example: "Pipeline"
 *                       title:
 *                         type: string
 *                         example: "Focus on 15 Enterprise deals older than 30 days"
 *                       description:
 *                         type: string
 *                       impact:
 *                         type: string
 *                         example: "High potential revenue recovery"
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error
 */
router.get('/', getRecommendations);

export default router;
