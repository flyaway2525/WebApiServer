function writeLog(level, message, details) {
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
function getRequestPath(request) {
    return request.originalUrl || request.url;
}
function getRequestIp(request) {
    return request.ip || request.socket.remoteAddress || 'unknown';
}
export function logInfo(message, details) {
    writeLog('INFO', message, details);
}
export function logError(message, details) {
    writeLog('ERROR', message, details);
}
export function createRequestLoggingMiddleware() {
    return (request, response, next) => {
        const startedAt = process.hrtime.bigint();
        response.on('finish', () => {
            const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
            const details = {
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
export function logRequestError(error, request) {
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
export function logServerStarted(details) {
    logInfo('API server started', {
        port: details.port,
        webOrigin: details.webOrigin,
        databaseUrl: details.databaseUrl,
        apiUrl: `http://localhost:${details.port}`,
        swaggerUrl: `http://localhost:${details.port}/api-docs`
    });
}
export function logServerStartFailed(error) {
    if (error instanceof Error) {
        logError('Failed to start API', {
            message: error.message,
            stack: error.stack
        });
        return;
    }
    logError('Failed to start API', { error });
}
