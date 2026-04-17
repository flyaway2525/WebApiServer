import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { createTask, listTasks } from './db.js';
import { openApiSpecification } from './swagger.js';
export function createApp() {
    const app = express();
    app.use(cors({
        origin: config.webOrigin
    }));
    app.use(express.json());
    app.get('/health', (_request, response) => {
        response.json({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    });
    app.get('/api/tasks', async (_request, response, next) => {
        try {
            const items = await listTasks();
            response.json({ items });
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/tasks', async (request, response, next) => {
        const title = typeof request.body?.title === 'string' ? request.body.title.trim() : '';
        if (!title) {
            response.status(400).json({ message: 'title is required' });
            return;
        }
        try {
            const item = await createTask(title);
            response.status(201).json(item);
        }
        catch (error) {
            next(error);
        }
    });
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification));
    app.use((error, _request, response, _next) => {
        const message = error instanceof Error ? error.message : 'Unexpected server error';
        response.status(500).json({ message });
    });
    return app;
}
