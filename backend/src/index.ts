import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import summaryRouter from './routes/summary.route';
import driversRouter from './routes/drivers.route';
import riskFactorsRouter from './routes/risk-factors.route';
import recommendationsRouter from './routes/recommendations.route';

import trendRouter from './routes/trend.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API v1 Routes
app.use('/api/v1/summary', summaryRouter);
app.use('/api/v1/drivers', driversRouter);
app.use('/api/v1/risk-factors', riskFactorsRouter);
app.use('/api/v1/recommendations', recommendationsRouter);
app.use('/api/v1/trend', trendRouter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'Healthy', version: '1.0.0' });
});

app.get('/', (_req, res) => {
    res.send("Server is up and running!!!")
})

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
});
