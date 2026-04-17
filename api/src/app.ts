import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import { config } from './config.js';
import { createTask, listTasks } from './db.js';
import { openApiSpecification } from './swagger.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.webOrigin
    })
  );
  app.use(express.json());

  app.get('/health', (_request: Request, response: Response) => {
    response.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/tasks', async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const items = await listTasks();
      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/tasks', async (request: Request, response: Response, next: NextFunction) => {
    const title = typeof request.body?.title === 'string' ? request.body.title.trim() : '';

    if (!title) {
      response.status(400).json({ message: 'title is required' });
      return;
    }

    try {
      const item = await createTask(title);
      response.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification));

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    response.status(500).json({ message });
  });

  return app;
}