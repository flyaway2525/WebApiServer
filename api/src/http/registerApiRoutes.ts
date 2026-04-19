import { NextFunction, Request, Response, Express } from 'express';

import {
  approveSpaceTransactionRequest,
  authenticateMemberForSpace,
  changeSpaceState,
  createSpace,
  createSpaceTransactionRequest,
  createSpaceTransaction,
  createTask,
  joinSpaceAsGuest,
  listSpaceMembers,
  listSpaces,
  listSpaceTransactionRequests,
  listSpaceTransactions,
  rejectSpaceTransactionRequest,
  listTasks
} from '../db.js';
import {
  parseCreateSpaceInput,
  parseCreateSpaceTransactionInput,
  parseCreateSpaceTransactionRequestInput,
  parseJoinSpaceInput,
  parseMemberSessionHeaders,
  parseRejectTransactionRequestInput,
  parseRequestId,
  parseSpaceId,
  parseUpdateSpaceStateInput,
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

  app.post('/api/spaces/session', async (request: Request, response: Response, next: NextFunction) => {
    const input = parseCreateSpaceInput(request.body);
    if (!input.ok) {
      respondBadRequest(response, input.message);
      return;
    }

    try {
      const { createSpaceWithSession } = await import('../db.js');
      const item = await createSpaceWithSession(input.value);
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

      const sessionHeaders = parseMemberSessionHeaders(request.headers as Record<string, unknown>);
      if (!sessionHeaders.ok) {
        respondBadRequest(response, sessionHeaders.message);
        return;
      }

      try {
        const sessionMember = await authenticateMemberForSpace(
          spaceId.value,
          sessionHeaders.value.memberId,
          sessionHeaders.value.token
        );
        const item = await createSpaceTransaction(spaceId.value, input.value, sessionMember);
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

  app.get(
    '/api/spaces/:spaceId/transaction-requests',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request.params.spaceId);
      if (!spaceId.ok) {
        respondBadRequest(response, spaceId.message);
        return;
      }

      try {
        const items = await listSpaceTransactionRequests(spaceId.value);
        response.json({ items });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    '/api/spaces/:spaceId/transaction-requests',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request.params.spaceId);
      if (!spaceId.ok) {
        respondBadRequest(response, spaceId.message);
        return;
      }

      const input = parseCreateSpaceTransactionRequestInput(request.body);
      if (!input.ok) {
        respondBadRequest(response, input.message);
        return;
      }

      const sessionHeaders = parseMemberSessionHeaders(request.headers as Record<string, unknown>);
      if (!sessionHeaders.ok) {
        respondBadRequest(response, sessionHeaders.message);
        return;
      }

      try {
        const sessionMember = await authenticateMemberForSpace(
          spaceId.value,
          sessionHeaders.value.memberId,
          sessionHeaders.value.token
        );
        const item = await createSpaceTransactionRequest(spaceId.value, input.value, sessionMember);
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

  app.post(
    '/api/spaces/:spaceId/transaction-requests/:requestId/approve',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request.params.spaceId);
      if (!spaceId.ok) {
        respondBadRequest(response, spaceId.message);
        return;
      }

      const requestId = parseRequestId(request.params.requestId);
      if (!requestId.ok) {
        respondBadRequest(response, requestId.message);
        return;
      }

      const sessionHeaders = parseMemberSessionHeaders(request.headers as Record<string, unknown>);
      if (!sessionHeaders.ok) {
        respondBadRequest(response, sessionHeaders.message);
        return;
      }

      try {
        const sessionMember = await authenticateMemberForSpace(
          spaceId.value,
          sessionHeaders.value.memberId,
          sessionHeaders.value.token
        );
        const item = await approveSpaceTransactionRequest(spaceId.value, requestId.value, sessionMember);
        response.json(item);
      } catch (error) {
        if (error instanceof Error) {
          respondBadRequest(response, error.message);
          return;
        }

        next(error);
      }
    }
  );

  app.post(
    '/api/spaces/:spaceId/transaction-requests/:requestId/reject',
    async (request: Request, response: Response, next: NextFunction) => {
      const spaceId = parseSpaceId(request.params.spaceId);
      if (!spaceId.ok) {
        respondBadRequest(response, spaceId.message);
        return;
      }

      const requestId = parseRequestId(request.params.requestId);
      if (!requestId.ok) {
        respondBadRequest(response, requestId.message);
        return;
      }

      const sessionHeaders = parseMemberSessionHeaders(request.headers as Record<string, unknown>);
      if (!sessionHeaders.ok) {
        respondBadRequest(response, sessionHeaders.message);
        return;
      }

      const input = parseRejectTransactionRequestInput(request.body);
      if (!input.ok) {
        respondBadRequest(response, input.message);
        return;
      }

      try {
        const sessionMember = await authenticateMemberForSpace(
          spaceId.value,
          sessionHeaders.value.memberId,
          sessionHeaders.value.token
        );
        const item = await rejectSpaceTransactionRequest(
          spaceId.value,
          requestId.value,
          sessionMember,
          input.value.rejectionReason
        );
        response.json(item);
      } catch (error) {
        if (error instanceof Error) {
          respondBadRequest(response, error.message);
          return;
        }

        next(error);
      }
    }
  );

  app.post('/api/spaces/:spaceId/state', async (request: Request, response: Response, next: NextFunction) => {
    const spaceId = parseSpaceId(request.params.spaceId);
    if (!spaceId.ok) {
      respondBadRequest(response, spaceId.message);
      return;
    }

    const input = parseUpdateSpaceStateInput(request.body);
    if (!input.ok) {
      respondBadRequest(response, input.message);
      return;
    }

    const sessionHeaders = parseMemberSessionHeaders(request.headers as Record<string, unknown>);
    if (!sessionHeaders.ok) {
      respondBadRequest(response, sessionHeaders.message);
      return;
    }

    try {
      const sessionMember = await authenticateMemberForSpace(
        spaceId.value,
        sessionHeaders.value.memberId,
        sessionHeaders.value.token
      );
      const item = await changeSpaceState(spaceId.value, input.value.state, sessionMember);
      response.json(item);
    } catch (error) {
      if (error instanceof Error) {
        respondBadRequest(response, error.message);
        return;
      }

      next(error);
    }
  });
}