import { getClient } from './client.js';
import { mapMemberRow, mapSpaceRow } from './mappers.js';
import { countMembersByRoleDefinitionId, generateSpaceCode, getAggregatedSpaceById, getAuthenticatedMember, getAuthenticatedMemberById, getSpaceByCode, getSpaceMemberById, issueMemberSession, insertMember, insertRoleDefinition, insertSpace, listRoleDefinitionsBySpaceId, updateSpaceState, insertTransactionEntry } from './lookups.js';
import { buildRoleDefinitions, getDefaultJoinRoleKey } from './roleDefinitions.js';
import { canUpdateSpaceState } from './authorization.js';
export async function listSpaces(sessionMember) {
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
      WHERE spaces.visibility = 'public' OR spaces.id = ?
      GROUP BY spaces.id
      ORDER BY spaces.created_at DESC, spaces.id DESC
    `,
        args: [sessionMember?.spaceId ?? -1]
    });
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
        role_definition_id AS roleDefinitionId,
        COALESCE(space_role_definitions.role_key, role) AS roleKey,
        COALESCE(space_role_definitions.label, role) AS roleLabel,
        COALESCE(space_role_definitions.capabilities_json, '[]') AS capabilitiesJson,
        is_guest AS isGuest,
        points,
        can_transfer AS canTransfer,
        created_at AS createdAt
      FROM space_members
      LEFT JOIN space_role_definitions ON space_role_definitions.id = space_members.role_definition_id
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
export async function listSpaceRoleDefinitionsByCode(code) {
    return listSpaceRoleDefinitionsByCodeForMember(code, null);
}
export async function listSpaceRoleDefinitionsByCodeForMember(code, sessionMember) {
    const space = await getSpaceByCode(code);
    if (!space) {
        throw new Error('Space not found');
    }
    const isSameSpaceMember = sessionMember?.spaceId === space.id;
    if (!space.allowGuestJoin && !isSameSpaceMember) {
        throw new Error('Role definitions are not available for this space');
    }
    return listRoleDefinitionsBySpaceId(space.id);
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
    const roleDefinitions = buildRoleDefinitions(input.kind, input.rolePreset);
    const insertedRoleDefinitions = new Map();
    for (const roleDefinition of roleDefinitions) {
        const roleDefinitionId = await insertRoleDefinition(spaceId, roleDefinition);
        insertedRoleDefinitions.set(roleDefinition.key, {
            id: roleDefinitionId,
            spaceId,
            key: roleDefinition.key,
            label: roleDefinition.label,
            description: roleDefinition.description ?? null,
            legacyRole: roleDefinition.legacyRole,
            maxParticipants: roleDefinition.maxParticipants ?? null,
            isSystem: roleDefinition.isSystem ?? false,
            capabilities: roleDefinition.capabilities,
            createdAt: new Date().toISOString()
        });
    }
    const hostRoleDefinition = insertedRoleDefinitions.get('host');
    if (!hostRoleDefinition) {
        throw new Error('Host role definition is required');
    }
    const hostMemberId = await insertMember(spaceId, {
        displayName: input.hostDisplayName,
        role: 'host',
        roleDefinitionId: hostRoleDefinition.id,
        roleKey: hostRoleDefinition.key,
        roleLabel: hostRoleDefinition.label,
        capabilities: hostRoleDefinition.capabilities,
        isGuest: false,
        points: input.kind === 'room' ? input.initialPoints : 0,
        canTransfer: true
    });
    if (input.kind === 'owner') {
        const bankRoleDefinition = insertedRoleDefinitions.get('bank');
        if (!bankRoleDefinition) {
            throw new Error('BANK role definition is required for owner spaces');
        }
        const bankMemberId = await insertMember(spaceId, {
            displayName: 'BANK',
            role: 'bank',
            roleDefinitionId: bankRoleDefinition.id,
            roleKey: bankRoleDefinition.key,
            roleLabel: bankRoleDefinition.label,
            capabilities: bankRoleDefinition.capabilities,
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
export async function createSpaceWithSession(input) {
    const space = await createSpace(input);
    const members = await listSpaceMembers(space.id);
    const hostMember = members.find((member) => member.role === 'host' && member.displayName === input.hostDisplayName)
        ?? members.find((member) => member.role === 'host')
        ?? null;
    if (!hostMember) {
        throw new Error('Failed to load host member');
    }
    const session = await issueMemberSession(hostMember.id);
    return {
        space,
        member: hostMember,
        session
    };
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
    const roleDefinitions = await listRoleDefinitionsBySpaceId(space.id);
    const fallbackRoleKey = getDefaultJoinRoleKey(space.kind);
    const requestedRoleKey = input.roleKey?.trim() || fallbackRoleKey;
    const roleDefinition = roleDefinitions.find((item) => item.key === requestedRoleKey) ?? null;
    if (!roleDefinition) {
        throw new Error('Selected role is not available for this space');
    }
    if (roleDefinition.isSystem) {
        throw new Error('Selected role cannot be joined directly');
    }
    if (roleDefinition.maxParticipants != null) {
        const currentCount = await countMembersByRoleDefinitionId(roleDefinition.id);
        if (currentCount >= roleDefinition.maxParticipants) {
            throw new Error(`${roleDefinition.label} の参加上限に達しています`);
        }
    }
    const initialPoints = space.kind === 'room' ? space.initialPoints : 0;
    const memberId = await insertMember(space.id, {
        displayName,
        role: roleDefinition.legacyRole,
        roleDefinitionId: roleDefinition.id,
        roleKey: roleDefinition.key,
        roleLabel: roleDefinition.label,
        capabilities: roleDefinition.capabilities,
        isGuest: true,
        points: initialPoints,
        canTransfer: roleDefinition.capabilities.includes('createTransaction')
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
    const session = await issueMemberSession(memberId);
    if (!member || !joinedSpace) {
        throw new Error('Failed to join space');
    }
    return {
        space: joinedSpace,
        member,
        session
    };
}
export async function authenticateMemberForSpace(spaceId, memberId, token) {
    const authenticated = await getAuthenticatedMember(spaceId, memberId, token);
    if (!authenticated) {
        throw new Error('Invalid member session');
    }
    return authenticated.member;
}
export async function authenticateMember(memberId, token) {
    const authenticated = await getAuthenticatedMemberById(memberId, token);
    if (!authenticated) {
        throw new Error('Invalid member session');
    }
    return authenticated.member;
}
export async function changeSpaceState(spaceId, state, sessionMember) {
    const space = await getAggregatedSpaceById(spaceId);
    if (!space) {
        throw new Error('Space not found');
    }
    canUpdateSpaceState(sessionMember, space, state);
    await updateSpaceState(spaceId, {
        state,
        closedByMemberId: state === 'active' ? null : sessionMember.id
    });
    const updated = await getAggregatedSpaceById(spaceId);
    if (!updated) {
        throw new Error('Failed to load updated space');
    }
    return updated;
}
