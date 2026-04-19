import { getClient } from './client.js';
import { assertTransactionPermission, validateReferencedMembers } from './authorization.js';
import { mapTransactionRow } from './mappers.js';
import { getSpaceById, getSpaceMemberById, getTransactionById } from './lookups.js';
export async function listSpaceTransactions(spaceId) {
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
    return result.rows.map((row) => mapTransactionRow(row));
}
export async function createSpaceTransaction(spaceId, input, sessionMember) {
    const client = getClient();
    const space = await getSpaceById(spaceId);
    if (!space) {
        throw new Error('Space not found');
    }
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new Error('amount must be a positive integer');
    }
    if (space.state !== 'active') {
        throw new Error('Space is not active');
    }
    const note = input.note?.trim() || undefined;
    const { sourceMember, targetMember } = await validateReferencedMembers(spaceId, input);
    const actorMember = input.actorMemberId == null ? null : await getSpaceMemberById(input.actorMemberId);
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
    if (sessionMember) {
        assertTransactionPermission(sessionMember, space, {
            ...input,
            actorType,
            actorMemberId: actorMember?.id
        });
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
        await client.batch([
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        ], 'write');
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
        await client.batch([
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        ], 'write');
    }
    if (input.kind === 'consume') {
        if (!sourceMember) {
            throw new Error('sourceMemberId is required for consume');
        }
        if (sourceMember.points < input.amount) {
            throw new Error('source member does not have enough points');
        }
        await client.batch([
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        ], 'write');
    }
    const inserted = await client.execute('SELECT last_insert_rowid() AS id');
    const transactionId = Number(inserted.rows[0]?.id ?? 0);
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
        throw new Error('Failed to load created transaction');
    }
    return transaction;
}
