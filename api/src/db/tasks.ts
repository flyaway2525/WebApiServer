import { getClient } from './client.js';
import { TaskRecord } from './types.js';

export async function listTasks(): Promise<TaskRecord[]> {
  const client = getClient();
  const result = await client.execute(
    'SELECT id, title, status, created_at AS createdAt FROM tasks ORDER BY id ASC'
  );

  return result.rows.map((row: Record<string, unknown>) => ({
    id: Number(row.id),
    title: String(row.title),
    status: row.status as TaskRecord['status'],
    createdAt: String(row.createdAt)
  }));
}

export async function createTask(title: string): Promise<TaskRecord> {
  const client = getClient();
  await client.execute({
    sql: 'INSERT INTO tasks (title, status) VALUES (?, ?)',
    args: [title, 'todo']
  });

  const result = await client.execute(
    'SELECT id, title, status, created_at AS createdAt FROM tasks ORDER BY id DESC LIMIT 1'
  );
  const row = result.rows[0];

  return {
    id: Number(row.id),
    title: String(row.title),
    status: row.status as TaskRecord['status'],
    createdAt: String(row.createdAt)
  };
}