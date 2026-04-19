import { createApp } from './app.js';
import { config } from './config.js';
import { initializeDatabase } from './db.js';
import { logServerStarted, logServerStartFailed } from './logging.js';
async function startServer() {
    await initializeDatabase();
    const app = createApp();
    app.listen(config.port, () => {
        logServerStarted({
            port: config.port,
            webOrigin: config.webOrigin,
            databaseUrl: config.databaseUrl
        });
    });
}
startServer().catch((error) => {
    logServerStartFailed(error);
    process.exitCode = 1;
});
