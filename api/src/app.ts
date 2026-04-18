import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import { config } from './config.js';
import {
  createSpace,
  createSpaceTransaction,
  createTask,
  joinSpaceAsGuest,
  listSpaceMembers,
  listSpaces,
  listSpaceTransactions,
  listTasks
} from './db.js';
import { openApiSpecification } from './swagger.js';

function parseSpaceId(request: Request, response: Response) {
  const spaceId = Number(request.params.spaceId);

  if (!Number.isInteger(spaceId) || spaceId <= 0) {
    response.status(400).json({ message: 'spaceId must be a positive integer' });
    return null;
  }

  return spaceId;
}

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
      const spaceId = parseSpaceId(request, response);
      if (spaceId == null) {
        return;
      }

      try {
        const items = await listSpaceMembers(spaceId);
        response.json({ items });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    '/api/spaces/:spaceId/transactions',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request, response);
      if (spaceId == null) {
        return;
      }

      try {
        const items = await listSpaceTransactions(spaceId);
        response.json({ items });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post('/api/spaces', async (request: Request, response: Response, next: NextFunction) => {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
    const kind = request.body?.kind;
    const visibility = request.body?.visibility;
    const initialPoints = Number(request.body?.initialPoints ?? 0);
    const hostDisplayName =
      typeof request.body?.hostDisplayName === 'string' ? request.body.hostDisplayName.trim() : '';
    const allowGuestJoin = Boolean(request.body?.allowGuestJoin);
    const bankCanMint = Boolean(request.body?.bankCanMint);

    if (!name) {
      response.status(400).json({ message: 'name is required' });
      return;
    }

    if (kind !== 'owner' && kind !== 'room') {
      response.status(400).json({ message: 'kind must be owner or room' });
      return;
    }

    if (visibility !== 'private' && visibility !== 'members' && visibility !== 'public') {
      response.status(400).json({ message: 'visibility must be private, members, or public' });
      return;
    }

    if (!Number.isInteger(initialPoints) || initialPoints < 0) {
      response.status(400).json({ message: 'initialPoints must be a non-negative integer' });
      return;
    }

    if (!hostDisplayName) {
      response.status(400).json({ message: 'hostDisplayName is required' });
      return;
    }

    try {
      const item = await createSpace({
        name,
        kind,
        visibility,
        initialPoints,
        allowGuestJoin,
        bankCanMint: kind === 'owner' ? bankCanMint : false,
        hostDisplayName
      });

      response.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/spaces/join', async (request: Request, response: Response, next: NextFunction) => {
    const code = typeof request.body?.code === 'string' ? request.body.code.trim() : '';
    const displayName =
      typeof request.body?.displayName === 'string' ? request.body.displayName.trim() : '';

    if (!code) {
      response.status(400).json({ message: 'code is required' });
      return;
    }

    if (!displayName) {
      response.status(400).json({ message: 'displayName is required' });
      return;
    }

    try {
      const item = await joinSpaceAsGuest({ code, displayName });
      response.status(201).json(item);
    } catch (error) {
      if (error instanceof Error) {
        response.status(400).json({ message: error.message });
        return;
      }

      next(error);
    }
  });

  app.post(
    '/api/spaces/:spaceId/transactions',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request, response);
      if (spaceId == null) {
        return;
      }

      const kind = request.body?.kind;
      const amount = Number(request.body?.amount ?? 0);
      const actorType = request.body?.actorType;
      const actorMemberId =
        request.body?.actorMemberId == null ? undefined : Number(request.body.actorMemberId);
      const sourceMemberId =
        request.body?.sourceMemberId == null ? undefined : Number(request.body.sourceMemberId);
      const targetMemberId =
        request.body?.targetMemberId == null ? undefined : Number(request.body.targetMemberId);
      const note = typeof request.body?.note === 'string' ? request.body.note.trim() : undefined;

      if (kind !== 'grant' && kind !== 'transfer' && kind !== 'consume') {
        response.status(400).json({ message: 'kind must be grant, transfer, or consume' });
        return;
      }

      if (!Number.isInteger(amount) || amount <= 0) {
        response.status(400).json({ message: 'amount must be a positive integer' });
        return;
      }

      if (actorType !== 'member' && actorType !== 'system' && actorType !== 'qr') {
        response.status(400).json({ message: 'actorType must be member, system, or qr' });
        return;
      }

      if (
        actorType === 'member' &&
        (actorMemberId == null || !Number.isInteger(actorMemberId) || actorMemberId <= 0)
      ) {
        response.status(400).json({ message: 'actorMemberId must be a positive integer' });
        return;
      }

      if (
        actorType !== 'member' &&
        actorMemberId != null &&
        Number.isInteger(actorMemberId) &&
        actorMemberId > 0
      ) {
        response.status(400).json({ message: 'actorMemberId must be omitted unless actorType is member' });
        return;
      }

      if (sourceMemberId != null && (!Number.isInteger(sourceMemberId) || sourceMemberId <= 0)) {
        response.status(400).json({ message: 'sourceMemberId must be a positive integer' });
        return;
      }

      if (targetMemberId != null && (!Number.isInteger(targetMemberId) || targetMemberId <= 0)) {
        response.status(400).json({ message: 'targetMemberId must be a positive integer' });
        return;
      }

      try {
        const item = await createSpaceTransaction(spaceId, {
          kind,
          amount,
          actorType,
          actorMemberId,
          sourceMemberId,
          targetMemberId,
          note
        });

        response.status(201).json(item);
      } catch (error) {
        if (error instanceof Error) {
          response.status(400).json({ message: error.message });
          return;
        }

        next(error);
      }
    }
  );

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpecification));

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    response.status(500).json({ message });
  });

  return app;
}