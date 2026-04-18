import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { createClient } from '@libsql/client';

import { config } from './config.js';

export type SpaceKind = 'owner' | 'room';
export type SpaceVisibility = 'private' | 'members' | 'public';
export type RankingMode = 'manual' | 'polling';
export type SpaceRole = 'host' | 'bank' | 'member';
export type TransactionKind = 'grant' | 'transfer' | 'consume';
export type TransactionActorType = 'member' | 'system' | 'qr';

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

export type JoinSpaceInput = {
  code: string;
  displayName: string;
};

export type JoinSpaceResult = {
  space: SpaceRecord;
  member: SpaceMemberRecord;
};

export type SpaceTransactionRecord = {
  id: number;
  spaceId: number;
  kind: TransactionKind;
  actorType: TransactionActorType;
  actorMemberId: number | null;
  actorDisplayName: string | null;
  sourceMemberId: number | null;
  sourceDisplayName: string | null;
  targetMemberId: number | null;
  targetDisplayName: string | null;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type CreateSpaceTransactionInput = {
  kind: TransactionKind;
  amount: number;
  actorType?: TransactionActorType;
  actorMemberId?: number;
  sourceMemberId?: number;
  targetMemberId?: number;
  note?: string;
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

function mapTransactionRow(row: Record<string, unknown>): SpaceTransactionRecord {
  return {
    id: Number(row.id),
    spaceId: Number(row.spaceId),
    kind: row.kind as TransactionKind,
    actorType: (row.actorType as TransactionActorType | null) ?? 'member',
    actorMemberId: row.actorMemberId == null ? null : Number(row.actorMemberId),
    actorDisplayName: row.actorDisplayName == null ? null : String(row.actorDisplayName),
    sourceMemberId: row.sourceMemberId == null ? null : Number(row.sourceMemberId),
    sourceDisplayName:
      row.sourceDisplayName == null ? null : String(row.sourceDisplayName),
    targetMemberId: row.targetMemberId == null ? null : Number(row.targetMemberId),
    targetDisplayName:
      row.targetDisplayName == null ? null : String(row.targetDisplayName),
    amount: Number(row.amount),
    note: row.note == null ? null : String(row.note),
    createdAt: String(row.createdAt)
  };
}

function generateSpaceCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizeSpaceCode(code: string) {
  return code.trim().toUpperCase();
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

  await client.execute(`
    CREATE TABLE IF NOT EXISTS space_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('grant', 'transfer', 'consume')),
      actor_type TEXT NOT NULL DEFAULT 'member' CHECK(actor_type IN ('member', 'system', 'qr')),
      actor_member_id INTEGER,
      source_member_id INTEGER,
      target_member_id INTEGER,
      amount INTEGER NOT NULL CHECK(amount > 0),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_member_id) REFERENCES space_members(id) ON DELETE SET NULL,
      FOREIGN KEY (source_member_id) REFERENCES space_members(id) ON DELETE SET NULL,
      FOREIGN KEY (target_member_id) REFERENCES space_members(id) ON DELETE SET NULL
    )
  `);

  const transactionColumns = await client.execute('PRAGMA table_info(space_transactions)');
  const hasActorMemberId = transactionColumns.rows.some(
    (row: Record<string, unknown>) => String(row.name) === 'actor_member_id'
  );
  const hasActorType = transactionColumns.rows.some(
    (row: Record<string, unknown>) => String(row.name) === 'actor_type'
  );

  if (!hasActorMemberId) {
    await client.execute('ALTER TABLE space_transactions ADD COLUMN actor_member_id INTEGER');
  }

  if (!hasActorType) {
    await client.execute(
      "ALTER TABLE space_transactions ADD COLUMN actor_type TEXT NOT NULL DEFAULT 'member'"
    );
  }

  await client.execute(
    "UPDATE space_transactions SET actor_type = 'member' WHERE actor_type IS NULL OR TRIM(actor_type) = ''"
  );

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

async function insertMember(
  spaceId: number,
  member: Omit<SpaceMemberRecord, 'id' | 'spaceId' | 'createdAt'>
) {
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

  const inserted = await client.execute('SELECT last_insert_rowid() AS id');
  return Number(inserted.rows[0]?.id ?? 0);
}

async function insertTransactionEntry(
  spaceId: number,
  transaction: {
    kind: TransactionKind;
    actorType?: TransactionActorType;
    actorMemberId?: number;
    sourceMemberId?: number;
    targetMemberId?: number;
    amount: number;
    note?: string;
  }
) {
  const client = getClient();

  await client.execute({
    sql: `
      INSERT INTO space_transactions (
        space_id,
        kind,
        actor_type,
        actor_member_id,
        source_member_id,
        target_member_id,
        amount,
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      spaceId,
      transaction.kind,
      transaction.actorType ?? 'member',
      transaction.actorMemberId ?? null,
      transaction.sourceMemberId ?? null,
      transaction.targetMemberId ?? null,
      transaction.amount,
      transaction.note ?? null
    ]
  });

  const inserted = await client.execute('SELECT last_insert_rowid() AS id');
  return Number(inserted.rows[0]?.id ?? 0);
}

async function getSpaceById(spaceId: number) {
  const client = getClient();
  const result = await client.execute({
    sql: `
      SELECT
        id,
        code,
        name,
        kind,
        visibility,
        initial_points AS initialPoints,
        allow_guest_join AS allowGuestJoin,
        ranking_mode AS rankingMode,
        bank_can_mint AS bankCanMint,
        created_at AS createdAt,
        0 AS memberCount,
        0 AS totalPoints
      FROM spaces
      WHERE id = ?
    `,
    args: [spaceId]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapSpaceRow(result.rows[0] as Record<string, unknown>);
}

async function getAggregatedSpaceById(spaceId: number) {
  const client = getClient();
  const result = await client.execute({
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

  if (result.rows.length === 0) {
    return null;
  }

  return mapSpaceRow(result.rows[0] as Record<string, unknown>);
}

async function getSpaceByCode(code: string) {
  const client = getClient();
  const result = await client.execute({
    sql: `
      SELECT
        id,
        code,
        name,
        kind,
        visibility,
        initial_points AS initialPoints,
        allow_guest_join AS allowGuestJoin,
        ranking_mode AS rankingMode,
        bank_can_mint AS bankCanMint,
        created_at AS createdAt,
        0 AS memberCount,
        0 AS totalPoints
      FROM spaces
      WHERE code = ?
    `,
    args: [normalizeSpaceCode(code)]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapSpaceRow(result.rows[0] as Record<string, unknown>);
}

async function getSpaceMemberById(memberId: number) {
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
      WHERE id = ?
    `,
    args: [memberId]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapMemberRow(result.rows[0] as Record<string, unknown>);
}

async function getTransactionById(transactionId: number) {
  const client = getClient();
  const result = await client.execute({
    sql: `
      SELECT
        space_transactions.id,
        space_transactions.space_id AS spaceId,
        space_transactions.kind,
        space_transactions.actor_type AS actorType,
        space_transactions.actor_member_id AS actorMemberId,
        actor.display_name AS actorDisplayName,
        space_transactions.source_member_id AS sourceMemberId,
        source.display_name AS sourceDisplayName,
        space_transactions.target_member_id AS targetMemberId,
        target.display_name AS targetDisplayName,
        space_transactions.amount,
        space_transactions.note,
        space_transactions.created_at AS createdAt
      FROM space_transactions
      LEFT JOIN space_members AS actor ON actor.id = space_transactions.actor_member_id
      LEFT JOIN space_members AS source ON source.id = space_transactions.source_member_id
      LEFT JOIN space_members AS target ON target.id = space_transactions.target_member_id
      WHERE space_transactions.id = ?
    `,
    args: [transactionId]
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapTransactionRow(result.rows[0] as Record<string, unknown>);
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

  const ownerHostMemberId = await insertMember(ownerSpaceId, {
    displayName: 'Event Owner',
    role: 'host',
    isGuest: false,
    points: 0,
    canTransfer: true
  });

  const bankMemberId = await insertMember(ownerSpaceId, {
    displayName: 'BANK',
    role: 'bank',
    isGuest: false,
    points: 10000,
    canTransfer: true
  });

  const guestAlphaId = await insertMember(ownerSpaceId, {
    displayName: 'Guest Alpha',
    role: 'member',
    isGuest: true,
    points: 1200,
    canTransfer: true
  });

  await insertTransactionEntry(ownerSpaceId, {
    kind: 'grant',
    actorType: 'member',
    actorMemberId: ownerHostMemberId,
    targetMemberId: bankMemberId,
    amount: 10000,
    note: 'Initial BANK allocation'
  });

  await insertTransactionEntry(ownerSpaceId, {
    kind: 'grant',
    actorType: 'member',
    actorMemberId: ownerHostMemberId,
    targetMemberId: guestAlphaId,
    amount: 1200,
    note: 'Initial guest allocation'
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

  const hostMemberId = await insertMember(roomSpaceId, {
    displayName: 'Host Player',
    role: 'host',
    isGuest: false,
    points: 8000,
    canTransfer: true
  });

  const guestBetaId = await insertMember(roomSpaceId, {
    displayName: 'Guest Beta',
    role: 'member',
    isGuest: true,
    points: 8000,
    canTransfer: true
  });

  await insertTransactionEntry(roomSpaceId, {
    kind: 'grant',
    actorType: 'member',
    actorMemberId: hostMemberId,
    targetMemberId: hostMemberId,
    amount: 8000,
    note: 'Initial host allocation'
  });

  await insertTransactionEntry(roomSpaceId, {
    kind: 'grant',
    actorType: 'member',
    actorMemberId: hostMemberId,
    targetMemberId: guestBetaId,
    amount: 8000,
    note: 'Initial room allocation'
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

export async function listSpaceTransactions(spaceId: number): Promise<SpaceTransactionRecord[]> {
  const client = getClient();
  const result = await client.execute({
    sql: `
      SELECT
        space_transactions.id,
        space_transactions.space_id AS spaceId,
        space_transactions.kind,
        space_transactions.actor_type AS actorType,
        space_transactions.actor_member_id AS actorMemberId,
        actor.display_name AS actorDisplayName,
        space_transactions.source_member_id AS sourceMemberId,
        source.display_name AS sourceDisplayName,
        space_transactions.target_member_id AS targetMemberId,
        target.display_name AS targetDisplayName,
        space_transactions.amount,
        space_transactions.note,
        space_transactions.created_at AS createdAt
      FROM space_transactions
      LEFT JOIN space_members AS actor ON actor.id = space_transactions.actor_member_id
      LEFT JOIN space_members AS source ON source.id = space_transactions.source_member_id
      LEFT JOIN space_members AS target ON target.id = space_transactions.target_member_id
      WHERE space_transactions.space_id = ?
      ORDER BY space_transactions.created_at DESC, space_transactions.id DESC
    `,
    args: [spaceId]
  });

  return result.rows.map((row: Record<string, unknown>) => mapTransactionRow(row));
}

export async function createSpace(input: CreateSpaceInput): Promise<SpaceRecord> {
  let code = generateSpaceCode();
  let attempts = 0;
  while (attempts < 5) {
    const client = getClient();
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

  const hostMemberId = await insertMember(spaceId, {
    displayName: input.hostDisplayName,
    role: 'host',
    isGuest: false,
    points: input.kind === 'room' ? input.initialPoints : 0,
    canTransfer: true
  });

  if (input.kind === 'owner') {
    const bankMemberId = await insertMember(spaceId, {
      displayName: 'BANK',
      role: 'bank',
      isGuest: false,
      points: input.initialPoints,
      canTransfer: true
    });

    await insertTransactionEntry(spaceId, {
      kind: 'grant',
      actorMemberId: hostMemberId,
      targetMemberId: bankMemberId,
      amount: input.initialPoints,
      note: 'Initial BANK allocation'
    });
  } else {
    await insertTransactionEntry(spaceId, {
      kind: 'grant',
      actorMemberId: hostMemberId,
      targetMemberId: hostMemberId,
      amount: input.initialPoints,
      note: 'Initial room allocation'
    });
  }

  const client = getClient();
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

export async function joinSpaceAsGuest(input: JoinSpaceInput): Promise<JoinSpaceResult> {
  const space = await getSpaceByCode(input.code);

  if (!space) {
    throw new Error('Space not found');
  }

  if (!space.allowGuestJoin) {
    throw new Error('Guest join is disabled for this space');
  }

  const displayName = input.displayName.trim();
  if (!displayName) {
    throw new Error('displayName is required');
  }

  const initialPoints = space.kind === 'room' ? space.initialPoints : 0;
  const memberId = await insertMember(space.id, {
    displayName,
    role: 'member',
    isGuest: true,
    points: initialPoints,
    canTransfer: true
  });

  if (initialPoints > 0) {
    await insertTransactionEntry(space.id, {
      kind: 'grant',
      actorType: 'system',
      targetMemberId: memberId,
      amount: initialPoints,
      note: 'Guest join allocation'
    });
  }

  const member = await getSpaceMemberById(memberId);
  const joinedSpace = await getAggregatedSpaceById(space.id);

  if (!member || !joinedSpace) {
    throw new Error('Failed to join space');
  }

  return {
    space: joinedSpace,
    member
  };
}

export async function createSpaceTransaction(
  spaceId: number,
  input: CreateSpaceTransactionInput
): Promise<SpaceTransactionRecord> {
  const client = getClient();
  const space = await getSpaceById(spaceId);

  if (!space) {
    throw new Error('Space not found');
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('amount must be a positive integer');
  }

  const note = input.note?.trim() || undefined;
  const sourceMember =
    input.sourceMemberId == null ? null : await getSpaceMemberById(input.sourceMemberId);
  const targetMember =
    input.targetMemberId == null ? null : await getSpaceMemberById(input.targetMemberId);
  const actorMember =
    input.actorMemberId == null ? null : await getSpaceMemberById(input.actorMemberId);
  const actorType = input.actorType ?? 'member';

  if (actorType !== 'member' && actorType !== 'system' && actorType !== 'qr') {
    throw new Error('actorType must be member, system, or qr');
  }

  if (actorType === 'member' && !actorMember) {
    throw new Error('actorMemberId is required');
  }

  if (actorMember && actorMember.spaceId !== spaceId) {
    throw new Error('actorMemberId must belong to the selected space');
  }

  if (actorType !== 'member' && actorMember) {
    throw new Error('actorMemberId must be omitted unless actorType is member');
  }

  if (sourceMember && sourceMember.spaceId !== spaceId) {
    throw new Error('sourceMemberId must belong to the selected space');
  }

  if (targetMember && targetMember.spaceId !== spaceId) {
    throw new Error('targetMemberId must belong to the selected space');
  }

  if (input.kind === 'grant') {
    if (!targetMember) {
      throw new Error('targetMemberId is required for grant');
    }

    if (!sourceMember && !(space.kind === 'owner' && space.bankCanMint)) {
      throw new Error('sourceMemberId is required unless owner space allows minting');
    }

    if (sourceMember && sourceMember.points < input.amount) {
      throw new Error('source member does not have enough points');
    }

    await client.batch(
      [
        ...(sourceMember
          ? [
              {
                sql: 'UPDATE space_members SET points = points - ? WHERE id = ?',
                args: [input.amount, sourceMember.id]
              }
            ]
          : []),
        {
          sql: 'UPDATE space_members SET points = points + ? WHERE id = ?',
          args: [input.amount, targetMember.id]
        },
        {
          sql: `
            INSERT INTO space_transactions (
              space_id,
              kind,
              actor_type,
              actor_member_id,
              source_member_id,
              target_member_id,
              amount,
              note
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            spaceId,
            'grant',
            actorType,
            actorMember?.id ?? null,
            sourceMember?.id ?? null,
            targetMember.id,
            input.amount,
            note ?? null
          ]
        }
      ],
      'write'
    );
  }

  if (input.kind === 'transfer') {
    if (!sourceMember) {
      throw new Error('sourceMemberId is required for transfer');
    }

    if (!targetMember) {
      throw new Error('targetMemberId is required for transfer');
    }

    if (sourceMember.id === targetMember.id) {
      throw new Error('sourceMemberId and targetMemberId must be different');
    }

    if (!sourceMember.canTransfer) {
      throw new Error('source member cannot transfer points');
    }

    if (sourceMember.points < input.amount) {
      throw new Error('source member does not have enough points');
    }

    await client.batch(
      [
        {
          sql: 'UPDATE space_members SET points = points - ? WHERE id = ?',
          args: [input.amount, sourceMember.id]
        },
        {
          sql: 'UPDATE space_members SET points = points + ? WHERE id = ?',
          args: [input.amount, targetMember.id]
        },
        {
          sql: `
            INSERT INTO space_transactions (
              space_id,
              kind,
              actor_type,
              actor_member_id,
              source_member_id,
              target_member_id,
              amount,
              note
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            spaceId,
            'transfer',
            actorType,
            actorMember?.id ?? null,
            sourceMember.id,
            targetMember.id,
            input.amount,
            note ?? null
          ]
        }
      ],
      'write'
    );
  }

  if (input.kind === 'consume') {
    if (!sourceMember) {
      throw new Error('sourceMemberId is required for consume');
    }

    if (sourceMember.points < input.amount) {
      throw new Error('source member does not have enough points');
    }

    await client.batch(
      [
        {
          sql: 'UPDATE space_members SET points = points - ? WHERE id = ?',
          args: [input.amount, sourceMember.id]
        },
        {
          sql: `
            INSERT INTO space_transactions (
              space_id,
              kind,
              actor_type,
              actor_member_id,
              source_member_id,
              target_member_id,
              amount,
              note
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            spaceId,
            'consume',
            actorType,
            actorMember?.id ?? null,
            sourceMember.id,
            null,
            input.amount,
            note ?? null
          ]
        }
      ],
      'write'
    );
  }

  const inserted = await client.execute('SELECT last_insert_rowid() AS id');
  const transactionId = Number(inserted.rows[0]?.id ?? 0);
  const transaction = await getTransactionById(transactionId);

  if (!transaction) {
    throw new Error('Failed to load created transaction');
  }

  return transaction;
}