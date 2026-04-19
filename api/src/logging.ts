import { Request, RequestHandler } from 'express';

type LogLevel = 'INFO' | 'ERROR';

type RequestLogDetails = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string;
};

type StartupLogDetails = {
  port: number;
  webOrigin: string;
  databaseUrl: string;
};

function writeLog(level: LogLevel, message: string, details?: unknown) {
  const prefix = `[${new Date().toISOString()}] [api] [${level}] ${message}`;

  if (details === undefined) {
    if (level === 'ERROR') {
      console.error(prefix);
      return;
    }

    console.log(prefix);
    return;
  }

  if (level === 'ERROR') {
    console.error(prefix, details);
    return;
  }

  console.log(prefix, details);
}

function getRequestPath(request: Request) {
  return request.originalUrl || request.url;
}

function getRequestIp(request: Request) {
  return request.ip || request.socket.remoteAddress || 'unknown';
}

export function logInfo(message: string, details?: unknown) {
  writeLog('INFO', message, details);
}

export function logError(message: string, details?: unknown) {
  writeLog('ERROR', message, details);
}

export function createRequestLoggingMiddleware(): RequestHandler {
  return (request, response, next) => {
    const startedAt = process.hrtime.bigint();

    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const details: RequestLogDetails = {
        method: request.method,
        path: getRequestPath(request),
        statusCode: response.statusCode,
        durationMs: Number(durationMs.toFixed(1)),
        ip: getRequestIp(request)
      };

      logInfo('Request completed', details);
    });

    next();
  };
}

export function logRequestError(error: unknown, request: Request) {
  if (error instanceof Error) {
    logError('Request failed', {
      method: request.method,
      path: getRequestPath(request),
      ip: getRequestIp(request),
      message: error.message,
      stack: error.stack
    });
    return;
  }

  logError('Request failed', {
    method: request.method,
    path: getRequestPath(request),
    ip: getRequestIp(request),
    error
  });
}

export function logServerStarted(details: StartupLogDetails) {
  logInfo('API server started', {
    port: details.port,
    webOrigin: details.webOrigin,
    databaseUrl: details.databaseUrl,
    apiUrl: `http://localhost:${details.port}`,
    swaggerUrl: `http://localhost:${details.port}/api-docs`
  });
}

export function logServerStartFailed(error: unknown) {
  if (error instanceof Error) {
    logError('Failed to start API', {
      message: error.message,
      stack: error.stack
    });
    return;
  }

  logError('Failed to start API', { error });
}