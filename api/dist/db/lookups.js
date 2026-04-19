import { getClient } from './client.js';
import { mapMemberRow, mapSpaceRow, mapTransactionRow } from './mappers.js';
export function generateSpaceCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}
export function normalizeSpaceCode(code) {
    return code.trim().toUpperCase();
}
export async function insertSpace(input) {
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
export async function insertMember(spaceId, member) {
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
export async function insertTransactionEntry(spaceId, transaction) {
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
export async function getSpaceById(spaceId) {
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
    return mapSpaceRow(result.rows[0]);
}
export async function getAggregatedSpaceById(spaceId) {
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
    return mapSpaceRow(result.rows[0]);
}
export async function getSpaceByCode(code) {
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
    return mapSpaceRow(result.rows[0]);
}
export async function getSpaceMemberById(memberId) {
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
    return mapMemberRow(result.rows[0]);
}
export async function getTransactionById(transactionId) {
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
    return mapTransactionRow(result.rows[0]);
}
