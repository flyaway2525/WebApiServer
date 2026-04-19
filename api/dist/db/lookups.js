import { randomUUID } from 'node:crypto';
import { getClient } from './client.js';
import { mapMemberRow, mapSpaceRow, mapTransactionRequestRow, mapTransactionRow } from './mappers.js';
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
        bank_can_mint,
        state,
        closed_at,
        closed_by_member_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        args: [
            input.code,
            input.name,
            input.kind,
            input.visibility,
            input.initialPoints,
            input.allowGuestJoin ? 1 : 0,
            'manual',
            input.bankCanMint ? 1 : 0,
            'active',
            null,
            null
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
        can_transfer,
        session_token,
        session_created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        args: [
            spaceId,
            member.displayName,
            member.role,
            member.isGuest ? 1 : 0,
            member.points,
            member.canTransfer ? 1 : 0,
            null,
            null
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
        state,
        closed_at AS closedAt,
        closed_by_member_id AS closedByMemberId,
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
        spaces.state,
        spaces.closed_at AS closedAt,
        spaces.closed_by_member_id AS closedByMemberId,
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
        state,
        closed_at AS closedAt,
        closed_by_member_id AS closedByMemberId,
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
export async function issueMemberSession(memberId) {
    const client = getClient();
    const token = randomUUID();
    await client.execute({
        sql: `
      UPDATE space_members
      SET session_token = ?, session_created_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
        args: [token, memberId]
    });
    const result = await client.execute({
        sql: `
      SELECT
        id AS memberId,
        space_id AS spaceId,
        session_token AS token,
        session_created_at AS issuedAt
      FROM space_members
      WHERE id = ?
    `,
        args: [memberId]
    });
    if (result.rows.length === 0) {
        throw new Error('Failed to issue member session');
    }
    const row = result.rows[0];
    return {
        memberId: Number(row.memberId),
        spaceId: Number(row.spaceId),
        token: String(row.token),
        issuedAt: String(row.issuedAt)
    };
}
export async function getAuthenticatedMember(spaceId, memberId, token) {
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
        created_at AS createdAt,
        session_token AS sessionToken,
        session_created_at AS sessionIssuedAt
      FROM space_members
      WHERE id = ? AND space_id = ?
    `,
        args: [memberId, spaceId]
    });
    if (result.rows.length === 0) {
        return null;
    }
    const row = result.rows[0];
    if (String(row.sessionToken ?? '') !== token) {
        return null;
    }
    return {
        member: mapMemberRow(row),
        session: {
            memberId: Number(row.id),
            spaceId: Number(row.spaceId),
            token,
            issuedAt: String(row.sessionIssuedAt ?? '')
        }
    };
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
export async function insertTransactionRequestEntry(spaceId, request) {
    const client = getClient();
    await client.execute({
        sql: `
      INSERT INTO space_transaction_requests (
        space_id,
        kind,
        status,
        requester_member_id,
        source_member_id,
        target_member_id,
        amount,
        note
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
    `,
        args: [
            spaceId,
            request.kind,
            request.requesterMemberId,
            request.sourceMemberId ?? null,
            request.targetMemberId ?? null,
            request.amount,
            request.note ?? null
        ]
    });
    const inserted = await client.execute('SELECT last_insert_rowid() AS id');
    return Number(inserted.rows[0]?.id ?? 0);
}
export async function getTransactionRequestById(requestId) {
    const client = getClient();
    const result = await client.execute({
        sql: `
      SELECT
        requests.id,
        requests.space_id AS spaceId,
        requests.kind,
        requests.status,
        requests.requester_member_id AS requesterMemberId,
        requester.display_name AS requesterDisplayName,
        requests.source_member_id AS sourceMemberId,
        source.display_name AS sourceDisplayName,
        requests.target_member_id AS targetMemberId,
        target.display_name AS targetDisplayName,
        requests.amount,
        requests.note,
        requests.rejection_reason AS rejectionReason,
        requests.approved_transaction_id AS approvedTransactionId,
        requests.resolved_at AS resolvedAt,
        requests.resolved_by_member_id AS resolvedByMemberId,
        resolver.display_name AS resolvedByDisplayName,
        requests.created_at AS createdAt
      FROM space_transaction_requests AS requests
      LEFT JOIN space_members AS requester ON requester.id = requests.requester_member_id
      LEFT JOIN space_members AS source ON source.id = requests.source_member_id
      LEFT JOIN space_members AS target ON target.id = requests.target_member_id
      LEFT JOIN space_members AS resolver ON resolver.id = requests.resolved_by_member_id
      WHERE requests.id = ?
    `,
        args: [requestId]
    });
    if (result.rows.length === 0) {
        return null;
    }
    return mapTransactionRequestRow(result.rows[0]);
}
export async function listTransactionRequestsBySpaceId(spaceId) {
    const client = getClient();
    const result = await client.execute({
        sql: `
      SELECT
        requests.id,
        requests.space_id AS spaceId,
        requests.kind,
        requests.status,
        requests.requester_member_id AS requesterMemberId,
        requester.display_name AS requesterDisplayName,
        requests.source_member_id AS sourceMemberId,
        source.display_name AS sourceDisplayName,
        requests.target_member_id AS targetMemberId,
        target.display_name AS targetDisplayName,
        requests.amount,
        requests.note,
        requests.rejection_reason AS rejectionReason,
        requests.approved_transaction_id AS approvedTransactionId,
        requests.resolved_at AS resolvedAt,
        requests.resolved_by_member_id AS resolvedByMemberId,
        resolver.display_name AS resolvedByDisplayName,
        requests.created_at AS createdAt
      FROM space_transaction_requests AS requests
      LEFT JOIN space_members AS requester ON requester.id = requests.requester_member_id
      LEFT JOIN space_members AS source ON source.id = requests.source_member_id
      LEFT JOIN space_members AS target ON target.id = requests.target_member_id
      LEFT JOIN space_members AS resolver ON resolver.id = requests.resolved_by_member_id
      WHERE requests.space_id = ?
      ORDER BY requests.created_at DESC, requests.id DESC
    `,
        args: [spaceId]
    });
    return result.rows.map((row) => mapTransactionRequestRow(row));
}
export async function resolveTransactionRequest(requestId, resolution) {
    const client = getClient();
    await client.execute({
        sql: `
      UPDATE space_transaction_requests
      SET
        status = ?,
        resolved_by_member_id = ?,
        resolved_at = CURRENT_TIMESTAMP,
        approved_transaction_id = ?,
        rejection_reason = ?
      WHERE id = ?
    `,
        args: [
            resolution.status,
            resolution.resolvedByMemberId,
            resolution.approvedTransactionId ?? null,
            resolution.rejectionReason ?? null,
            requestId
        ]
    });
}
export async function updateSpaceState(spaceId, update) {
    const client = getClient();
    const closedByMemberId = update.state === 'active' ? null : update.closedByMemberId ?? null;
    const closedAt = update.state === 'active' ? null : 'CURRENT_TIMESTAMP';
    if (closedAt === null) {
        await client.execute({
            sql: `
        UPDATE spaces
        SET state = ?, closed_at = NULL, closed_by_member_id = NULL
        WHERE id = ?
      `,
            args: [update.state, spaceId]
        });
        return;
    }
    await client.execute({
        sql: `
      UPDATE spaces
      SET state = ?, closed_at = CURRENT_TIMESTAMP, closed_by_member_id = ?
      WHERE id = ?
    `,
        args: [update.state, closedByMemberId, spaceId]
    });
}
