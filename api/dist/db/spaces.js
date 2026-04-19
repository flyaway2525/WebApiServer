import { getClient } from './client.js';
import { mapMemberRow, mapSpaceRow } from './mappers.js';
import { generateSpaceCode, getAggregatedSpaceById, getSpaceByCode, getSpaceMemberById, insertMember, insertSpace, insertTransactionEntry } from './lookups.js';
export async function listSpaces() {
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
    return result.rows.map((row) => mapSpaceRow(row));
}
export async function listSpaceMembers(spaceId) {
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
    return result.rows.map((row) => mapMemberRow(row));
}
export async function createSpace(input) {
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
    }
    else {
        await insertTransactionEntry(spaceId, {
            kind: 'grant',
            actorMemberId: hostMemberId,
            targetMemberId: hostMemberId,
            amount: input.initialPoints,
            note: 'Initial room allocation'
        });
    }
    const created = await getAggregatedSpaceById(spaceId);
    if (!created) {
        throw new Error('Failed to load created space');
    }
    return created;
}
export async function joinSpaceAsGuest(input) {
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
