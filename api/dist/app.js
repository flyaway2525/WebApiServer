import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { registerApiRoutes } from './http/registerApiRoutes.js';
import { createRequestLoggingMiddleware, logRequestError } from './logging.js';
import { openApiSpecification } from './swagger.js';
export function createApp() {
    const app = express();
    app.use(cors({
        origin: config.webOrigin
    }));
    app.use(express.json());
    app.use(createRequestLoggingMiddleware());
    app.get('/health', (_request, response) => {
        response.json({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    });
    registerApiRoutes(app);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification));
    app.use((error, request, response, _next) => {
        logRequestError(error, request);
        const message = error instanceof Error ? error.message : 'Unexpected server error';
        response.status(500).json({ message });
    });
    return app;
}
