import { createApp } from './app.js';
import { config } from './config.js';
import { initializeDatabase } from './db.js';

async function startServer() {
  await initializeDatabase();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
    console.log(`Swagger UI on http://localhost:${config.port}/api-docs`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API', error);
  process.exitCode = 1;
});