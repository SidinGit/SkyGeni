import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SkyGeni Revenue Intelligence API',
            version: '1.0.0',
            description: 'API for the Revenue Intelligence Console - helps CROs understand revenue performance and get actionable insights.',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: 'https://skygeni-pves.onrender.com',
                description: 'Production server',
            },
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        tags: [
            {
                name: 'Summary',
                description: 'Quarterly revenue summary and performance metrics',
            },
            {
                name: 'Drivers',
                description: 'Revenue drivers including pipeline, win rate, deal size, and cycle time',
            },
            {
                name: 'Risk Factors',
                description: 'Identifies risks like stale deals, underperforming reps, and low activity accounts',
            },
            {
                name: 'Recommendations',
                description: 'Actionable suggestions based on data analysis',
            },
            {
                name: 'Trend',
                description: 'Historical revenue trend analysis',
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
