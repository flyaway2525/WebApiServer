import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { getClient } from './client.js';
import { insertMember, insertSpace, insertTransactionEntry } from './lookups.js';
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
      state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active', 'closed', 'archived')),
      closed_at TEXT,
      closed_by_member_id INTEGER,
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
      session_token TEXT,
      session_created_at TEXT,
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
    await client.execute(`
    CREATE TABLE IF NOT EXISTS space_transaction_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('grant', 'transfer', 'consume')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      requester_member_id INTEGER NOT NULL,
      source_member_id INTEGER,
      target_member_id INTEGER,
      amount INTEGER NOT NULL CHECK(amount > 0),
      note TEXT,
      rejection_reason TEXT,
      approved_transaction_id INTEGER,
      resolved_at TEXT,
      resolved_by_member_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
      FOREIGN KEY (requester_member_id) REFERENCES space_members(id) ON DELETE CASCADE,
      FOREIGN KEY (source_member_id) REFERENCES space_members(id) ON DELETE SET NULL,
      FOREIGN KEY (target_member_id) REFERENCES space_members(id) ON DELETE SET NULL,
      FOREIGN KEY (approved_transaction_id) REFERENCES space_transactions(id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by_member_id) REFERENCES space_members(id) ON DELETE SET NULL
    )
  `);
    const spaceColumns = await client.execute('PRAGMA table_info(spaces)');
    const hasState = spaceColumns.rows.some((row) => String(row.name) === 'state');
    const hasClosedAt = spaceColumns.rows.some((row) => String(row.name) === 'closed_at');
    const hasClosedByMemberId = spaceColumns.rows.some((row) => String(row.name) === 'closed_by_member_id');
    if (!hasState) {
        await client.execute("ALTER TABLE spaces ADD COLUMN state TEXT NOT NULL DEFAULT 'active'");
    }
    if (!hasClosedAt) {
        await client.execute('ALTER TABLE spaces ADD COLUMN closed_at TEXT');
    }
    if (!hasClosedByMemberId) {
        await client.execute('ALTER TABLE spaces ADD COLUMN closed_by_member_id INTEGER');
    }
    const memberColumns = await client.execute('PRAGMA table_info(space_members)');
    const hasSessionToken = memberColumns.rows.some((row) => String(row.name) === 'session_token');
    const hasSessionCreatedAt = memberColumns.rows.some((row) => String(row.name) === 'session_created_at');
    if (!hasSessionToken) {
        await client.execute('ALTER TABLE space_members ADD COLUMN session_token TEXT');
    }
    if (!hasSessionCreatedAt) {
        await client.execute('ALTER TABLE space_members ADD COLUMN session_created_at TEXT');
    }
    const transactionColumns = await client.execute('PRAGMA table_info(space_transactions)');
    const hasActorMemberId = transactionColumns.rows.some((row) => String(row.name) === 'actor_member_id');
    const hasActorType = transactionColumns.rows.some((row) => String(row.name) === 'actor_type');
    if (!hasActorMemberId) {
        await client.execute('ALTER TABLE space_transactions ADD COLUMN actor_member_id INTEGER');
    }
    if (!hasActorType) {
        await client.execute("ALTER TABLE space_transactions ADD COLUMN actor_type TEXT NOT NULL DEFAULT 'member'");
    }
    const transactionRequestColumns = await client.execute('PRAGMA table_info(space_transaction_requests)');
    const hasRejectionReason = transactionRequestColumns.rows.some((row) => String(row.name) === 'rejection_reason');
    if (!hasRejectionReason) {
        await client.execute('ALTER TABLE space_transaction_requests ADD COLUMN rejection_reason TEXT');
    }
    await client.execute("UPDATE space_transactions SET actor_type = 'member' WHERE actor_type IS NULL OR TRIM(actor_type) = ''");
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
    const existingSpaces = await client.execute('SELECT COUNT(*) AS count FROM spaces');
    const spaceCount = Number(existingSpaces.rows[0]?.count ?? 0);
    if (spaceCount === 0) {
        await seedDefaultSpaces();
    }
}
