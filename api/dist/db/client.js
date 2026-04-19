import { createClient } from '@libsql/client';
import { config } from '../config.js';
let client = null;
export function getClient() {
    if (!client) {
        client = createClient({ url: config.databaseUrl });
    }
    return client;
}
