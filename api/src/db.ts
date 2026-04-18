import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { createClient } from '@libsql/client';

import { config } from './config.js';

export type SpaceKind = 'owner' | 'room';
export type SpaceVisibility = 'private' | 'members' | 'public';
export type RankingMode = 'manual' | 'polling';
export type SpaceRole = 'host' | 'bank' | 'member';

export type TaskRecord = {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
  createdAt: string;
};

export type SpaceRecord = {
  id: number;
  code: string;
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: number;
  allowGuestJoin: boolean;
  rankingMode: RankingMode;
  bankCanMint: boolean;
  createdAt: string;
  memberCount: number;
  totalPoints: number;
};

export type SpaceMemberRecord = {
  id: number;
  spaceId: number;
  displayName: string;
  role: SpaceRole;
  isGuest: boolean;
  points: number;
  canTransfer: boolean;
  createdAt: string;
};

export type CreateSpaceInput = {
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: number;
  allowGuestJoin: boolean;
  bankCanMint: boolean;
  hostDisplayName: string;
};

let client: ReturnType<typeof createClient> | null = null;

function toBoolean(value: unknown) {
  return Number(value ?? 0) === 1;
}

function mapSpaceRow(row: Record<string, unknown>): SpaceRecord {
  return {
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    kind: row.kind as SpaceKind,
    visibility: row.visibility as SpaceVisibility,
    initialPoints: Number(row.initialPoints),
    allowGuestJoin: toBoolean(row.allowGuestJoin),
    rankingMode: row.rankingMode as RankingMode,
    bankCanMint: toBoolean(row.bankCanMint),
    createdAt: String(row.createdAt),
    memberCount: Number(row.memberCount ?? 0),
    totalPoints: Number(row.totalPoints ?? 0)
  };
}

function mapMemberRow(row: Record<string, unknown>): SpaceMemberRecord {
  return {
    id: Number(row.id),
    spaceId: Number(row.spaceId),
    displayName: String(row.displayName),
    role: row.role as SpaceRole,
    isGuest: toBoolean(row.isGuest),
    points: Number(row.points),
    canTransfer: toBoolean(row.canTransfer),
    createdAt: String(row.createdAt)
  };
}

function generateSpaceCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

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

  await client.execute(`
    CREATE TABLE IF NOT EXISTS spaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('owner', 'room')),
      visibility TEXT NOT NULL CHECK(visibility IN ('private', 'members', 'public')),
      initial_points INTEGER NOT NULL,
      allow_guest_join INTEGER NOT NULL DEFAULT 1,
      ranking_mode TEXT NOT NULL DEFAULT 'manual' CHECK(ranking_mode IN ('manual', 'polling')),
      bank_can_mint INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS space_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('host', 'bank', 'member')),
      is_guest INTEGER NOT NULL DEFAULT 1,
      points INTEGER NOT NULL DEFAULT 0,
      can_transfer INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
    )
  `);

  const existing = await client.execute('SELECT COUNT(*) AS count FROM tasks');
  const count = Number(existing.rows[0]?.count ?? 0);

  if (count === 0) {
    await client.batch(
      [
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
      ],
      'write'
    );
  }

  const existingSpaces = await client.execute('SELECT COUNT(*) AS count FROM spaces');
  const spaceCount = Number(existingSpaces.rows[0]?.count ?? 0);

  if (spaceCount === 0) {
    await seedDefaultSpaces();
  }
}

async function insertSpace(input: CreateSpaceInput & { code: string }) {
  const client = getClient();

  await client.execute({
    sql: `
      INSERT INTO spaces (
        code,
        name,
        kind,
        visibility,
        initial_points,
        allow_guest_join,
        ranking_mode,
        bank_can_mint
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      input.code,
      input.name,
      input.kind,
      input.visibility,
      input.initialPoints,
      input.allowGuestJoin ? 1 : 0,
      'manual',
      input.bankCanMint ? 1 : 0
    ]
  });

  const inserted = await client.execute('SELECT last_insert_rowid() AS id');
  return Number(inserted.rows[0]?.id ?? 0);
}

async function insertMember(spaceId: number, member: Omit<SpaceMemberRecord, 'id' | 'spaceId' | 'createdAt'>) {
  const client = getClient();

  await client.execute({
    sql: `
      INSERT INTO space_members (
        space_id,
        display_name,
        role,
        is_guest,
        points,
        can_transfer
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [
      spaceId,
      member.displayName,
      member.role,
      member.isGuest ? 1 : 0,
      member.points,
      member.canTransfer ? 1 : 0
    ]
  });
}

async function seedDefaultSpaces() {
  const ownerSpaceId = await insertSpace({
    code: 'BANK01',
    name: 'Weekend Prize Bank',
    kind: 'owner',
    visibility: 'members',
    initialPoints: 10000,
    allowGuestJoin: true,
    bankCanMint: true,
    hostDisplayName: 'Event Owner'
  });

  await insertMember(ownerSpaceId, {
    displayName: 'Event Owner',
    role: 'host',
    isGuest: false,
    points: 0,
    canTransfer: true
  });

  await insertMember(ownerSpaceId, {
    displayName: 'BANK',
    role: 'bank',
    isGuest: false,
    points: 10000,
    canTransfer: true
  });

  await insertMember(ownerSpaceId, {
    displayName: 'Guest Alpha',
    role: 'member',
    isGuest: true,
    points: 1200,
    canTransfer: true
  });

  const roomSpaceId = await insertSpace({
    code: 'ROOM01',
    name: 'Duel Room',
    kind: 'room',
    visibility: 'private',
    initialPoints: 8000,
    allowGuestJoin: true,
    bankCanMint: false,
    hostDisplayName: 'Host Player'
  });

  await insertMember(roomSpaceId, {
    displayName: 'Host Player',
    role: 'host',
    isGuest: false,
    points: 8000,
    canTransfer: true
  });

  await insertMember(roomSpaceId, {
    displayName: 'Guest Beta',
    role: 'member',
    isGuest: true,
    points: 8000,
    canTransfer: true
  });
}

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

export async function listSpaces(): Promise<SpaceRecord[]> {
  const client = getClient();
  const result = await client.execute(`
    SELECT
      spaces.id,
      spaces.code,
      spaces.name,
      spaces.kind,
      spaces.visibility,
      spaces.initial_points AS initialPoints,
      spaces.allow_guest_join AS allowGuestJoin,
      spaces.ranking_mode AS rankingMode,
      spaces.bank_can_mint AS bankCanMint,
      spaces.created_at AS createdAt,
      COUNT(space_members.id) AS memberCount,
      COALESCE(SUM(space_members.points), 0) AS totalPoints
    FROM spaces
    LEFT JOIN space_members ON space_members.space_id = spaces.id
    GROUP BY spaces.id
    ORDER BY spaces.created_at DESC, spaces.id DESC
  `);

  return result.rows.map((row: Record<string, unknown>) => mapSpaceRow(row));
}

export async function listSpaceMembers(spaceId: number): Promise<SpaceMemberRecord[]> {
  const client = getClient();
  const result = await client.execute({
    sql: `
      SELECT
        id,
        space_id AS spaceId,
        display_name AS displayName,
        role,
        is_guest AS isGuest,
        points,
        can_transfer AS canTransfer,
        created_at AS createdAt
      FROM space_members
      WHERE space_id = ?
      ORDER BY
        CASE role
          WHEN 'bank' THEN 0
          WHEN 'host' THEN 1
          ELSE 2
        END,
        points DESC,
        id ASC
    `,
    args: [spaceId]
  });

  return result.rows.map((row: Record<string, unknown>) => mapMemberRow(row));
}

export async function createSpace(input: CreateSpaceInput): Promise<SpaceRecord> {
  const client = getClient();

  let code = generateSpaceCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await client.execute({
      sql: 'SELECT id FROM spaces WHERE code = ?',
      args: [code]
    });

    if (existing.rows.length === 0) {
      break;
    }

    code = generateSpaceCode();
    attempts += 1;
  }

  const spaceId = await insertSpace({
    ...input,
    code
  });

  await insertMember(spaceId, {
    displayName: input.hostDisplayName,
    role: 'host',
    isGuest: false,
    points: input.kind === 'room' ? input.initialPoints : 0,
    canTransfer: true
  });

  if (input.kind === 'owner') {
    await insertMember(spaceId, {
      displayName: 'BANK',
      role: 'bank',
      isGuest: false,
      points: input.initialPoints,
      canTransfer: true
    });
  }

  const created = await client.execute({
    sql: `
      SELECT
        spaces.id,
        spaces.code,
        spaces.name,
        spaces.kind,
        spaces.visibility,
        spaces.initial_points AS initialPoints,
        spaces.allow_guest_join AS allowGuestJoin,
        spaces.ranking_mode AS rankingMode,
        spaces.bank_can_mint AS bankCanMint,
        spaces.created_at AS createdAt,
        COUNT(space_members.id) AS memberCount,
        COALESCE(SUM(space_members.points), 0) AS totalPoints
      FROM spaces
      LEFT JOIN space_members ON space_members.space_id = spaces.id
      WHERE spaces.id = ?
      GROUP BY spaces.id
    `,
    args: [spaceId]
  });

  return mapSpaceRow(created.rows[0] as Record<string, unknown>);
}