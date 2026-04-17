import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { config } from './config.js';
let client = null;
function getClient() {
    if (!client) {
        client = createClient({ url: config.databaseUrl });
    }
    return client;
}
export async function initializeDatabase() {
    if (config.databaseUrl.startsWith('file:')) {
        const databaseFilePath = config.databaseUrl.replace(/^file:/, '');
        const directory = path.dirname(databaseFilePath);
        if (directory && directory !== '.') {
            await mkdir(directory, { recursive: true });
        }
    }
    const client = getClient();
    await client.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
    const existing = await client.execute('SELECT COUNT(*) AS count FROM tasks');
    const count = Number(existing.rows[0]?.count ?? 0);
    if (count === 0) {
        await client.batch([
            {
                sql: 'INSERT INTO tasks (title, status) VALUES (?, ?)',
                args: ['Express API wired to Swagger', 'done']
            },
            {
                sql: 'INSERT INTO tasks (title, status) VALUES (?, ?)',
                args: ['React client can load tasks', 'doing']
            },
            {
                sql: 'INSERT INTO tasks (title, status) VALUES (?, ?)',
                args: ['Unity client will reuse this API contract', 'todo']
            }
        ], 'write');
    }
}
export async function listTasks() {
    const client = getClient();
    const result = await client.execute('SELECT id, title, status, created_at AS createdAt FROM tasks ORDER BY id ASC');
    return result.rows.map((row) => ({
        id: Number(row.id),
        title: String(row.title),
        status: row.status,
        createdAt: String(row.createdAt)
    }));
}
export async function createTask(title) {
    const client = getClient();
    await client.execute({
        sql: 'INSERT INTO tasks (title, status) VALUES (?, ?)',
        args: [title, 'todo']
    });
    const result = await client.execute('SELECT id, title, status, created_at AS createdAt FROM tasks ORDER BY id DESC LIMIT 1');
    const row = result.rows[0];
    return {
        id: Number(row.id),
        title: String(row.title),
        status: row.status,
        createdAt: String(row.createdAt)
    };
}
