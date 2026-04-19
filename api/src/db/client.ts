import { createClient } from '@libsql/client';

import { config } from '../config.js';

let client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!client) {
    client = createClient({ url: config.databaseUrl });
  }

  return client;
}