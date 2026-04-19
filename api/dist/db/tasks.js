import { getClient } from './client.js';
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
