import { NextFunction, Request, Response, Express } from 'express';

import {
  createSpace,
  createSpaceTransaction,
  createTask,
  joinSpaceAsGuest,
  listSpaceMembers,
  listSpaces,
  listSpaceTransactions,
  listTasks
} from '../db.js';
import {
  parseCreateSpaceInput,
  parseCreateSpaceTransactionInput,
  parseJoinSpaceInput,
  parseSpaceId,
  parseTaskTitle,
  respondBadRequest
} from './validation.js';

export function registerApiRoutes(app: Express) {
  app.get('/api/tasks', async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const items = await listTasks();
      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/tasks', async (request: Request, response: Response, next: NextFunction) => {
    const title = parseTaskTitle(request.body);
    if (!title.ok) {
      respondBadRequest(response, title.message);
      return;
    }

    try {
      const item = await createTask(title.value);
      response.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/spaces', async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const items = await listSpaces();
      response.json({ items });
    } catch (error) {
      next(error);
    }
  });

  app.get(
    '/api/spaces/:spaceId/members',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request.params.spaceId);
      if (!spaceId.ok) {
        respondBadRequest(response, spaceId.message);
        return;
      }

      try {
        const items = await listSpaceMembers(spaceId.value);
        response.json({ items });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    '/api/spaces/:spaceId/transactions',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request.params.spaceId);
      if (!spaceId.ok) {
        respondBadRequest(response, spaceId.message);
        return;
      }

      try {
        const items = await listSpaceTransactions(spaceId.value);
        response.json({ items });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post('/api/spaces', async (request: Request, response: Response, next: NextFunction) => {
    const input = parseCreateSpaceInput(request.body);
    if (!input.ok) {
      respondBadRequest(response, input.message);
      return;
    }

    try {
      const item = await createSpace(input.value);
      response.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/spaces/join', async (request: Request, response: Response, next: NextFunction) => {
    const input = parseJoinSpaceInput(request.body);
    if (!input.ok) {
      respondBadRequest(response, input.message);
      return;
    }

    try {
      const item = await joinSpaceAsGuest(input.value);
      response.status(201).json(item);
    } catch (error) {
      if (error instanceof Error) {
        respondBadRequest(response, error.message);
        return;
      }

      next(error);
    }
  });

  app.post(
    '/api/spaces/:spaceId/transactions',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request.params.spaceId);
      if (!spaceId.ok) {
        respondBadRequest(response, spaceId.message);
        return;
      }

      const input = parseCreateSpaceTransactionInput(request.body);
      if (!input.ok) {
        respondBadRequest(response, input.message);
        return;
      }

      try {
        const item = await createSpaceTransaction(spaceId.value, input.value);
        response.status(201).json(item);
      } catch (error) {
        if (error instanceof Error) {
          respondBadRequest(response, error.message);
          return;
        }

        next(error);
      }
    }
  );
}