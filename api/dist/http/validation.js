function parsePositiveInteger(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}
function parseOptionalPositiveInteger(value) {
    if (value == null) {
        return undefined;
    }
    return parsePositiveInteger(value) ?? undefined;
}
export function respondBadRequest(response, message) {
    response.status(400).json({ message });
}
export function parseSpaceId(value) {
    const spaceId = Number(value);
    if (!Number.isInteger(spaceId) || spaceId <= 0) {
        return { ok: false, message: 'spaceId must be a positive integer' };
    }
    return { ok: true, value: spaceId };
}
export function parseTaskTitle(body) {
    const title = typeof body?.title === 'string'
        ? body.title.trim()
        : '';
    if (!title) {
        return { ok: false, message: 'title is required' };
    }
    return { ok: true, value: title };
}
export function parseCreateSpaceInput(body) {
    const requestBody = (body ?? {});
    const name = typeof requestBody.name === 'string' ? requestBody.name.trim() : '';
    const kind = requestBody.kind;
    const visibility = requestBody.visibility;
    const initialPoints = Number(requestBody.initialPoints ?? 0);
    const hostDisplayName = typeof requestBody.hostDisplayName === 'string' ? requestBody.hostDisplayName.trim() : '';
    const allowGuestJoin = Boolean(requestBody.allowGuestJoin);
    const bankCanMint = Boolean(requestBody.bankCanMint);
    if (!name) {
        return { ok: false, message: 'name is required' };
    }
    if (kind !== 'owner' && kind !== 'room') {
        return { ok: false, message: 'kind must be owner or room' };
    }
    if (visibility !== 'private' && visibility !== 'members' && visibility !== 'public') {
        return { ok: false, message: 'visibility must be private, members, or public' };
    }
    if (!Number.isInteger(initialPoints) || initialPoints < 0) {
        return { ok: false, message: 'initialPoints must be a non-negative integer' };
    }
    if (!hostDisplayName) {
        return { ok: false, message: 'hostDisplayName is required' };
    }
    return {
        ok: true,
        value: {
            name,
            kind: kind,
            visibility: visibility,
            initialPoints,
            allowGuestJoin,
            bankCanMint: kind === 'owner' ? bankCanMint : false,
            hostDisplayName
        }
    };
}
export function parseJoinSpaceInput(body) {
    const requestBody = (body ?? {});
    const code = typeof requestBody.code === 'string' ? requestBody.code.trim() : '';
    const displayName = typeof requestBody.displayName === 'string' ? requestBody.displayName.trim() : '';
    if (!code) {
        return { ok: false, message: 'code is required' };
    }
    if (!displayName) {
        return { ok: false, message: 'displayName is required' };
    }
    return {
        ok: true,
        value: { code, displayName }
    };
}
export function parseCreateSpaceTransactionInput(body) {
    const requestBody = (body ?? {});
    const kind = requestBody.kind;
    const amount = Number(requestBody.amount ?? 0);
    const actorType = requestBody.actorType;
    const actorMemberId = parseOptionalPositiveInteger(requestBody.actorMemberId);
    const sourceMemberId = parseOptionalPositiveInteger(requestBody.sourceMemberId);
    const targetMemberId = parseOptionalPositiveInteger(requestBody.targetMemberId);
    const note = typeof requestBody.note === 'string' ? requestBody.note.trim() : undefined;
    if (kind !== 'grant' && kind !== 'transfer' && kind !== 'consume') {
        return { ok: false, message: 'kind must be grant, transfer, or consume' };
    }
    if (!Number.isInteger(amount) || amount <= 0) {
        return { ok: false, message: 'amount must be a positive integer' };
    }
    if (actorType !== 'member' && actorType !== 'system' && actorType !== 'qr') {
        return { ok: false, message: 'actorType must be member, system, or qr' };
    }
    if (requestBody.actorMemberId != null && actorMemberId == null) {
        return { ok: false, message: 'actorMemberId must be a positive integer' };
    }
    if (requestBody.sourceMemberId != null && sourceMemberId == null) {
        return { ok: false, message: 'sourceMemberId must be a positive integer' };
    }
    if (requestBody.targetMemberId != null && targetMemberId == null) {
        return { ok: false, message: 'targetMemberId must be a positive integer' };
    }
    if (actorType === 'member' && actorMemberId == null) {
        return { ok: false, message: 'actorMemberId must be a positive integer' };
    }
    if (actorType !== 'member' && actorMemberId != null) {
        return { ok: false, message: 'actorMemberId must be omitted unless actorType is member' };
    }
    return {
        ok: true,
        value: {
            kind: kind,
            amount,
            actorType: actorType,
            actorMemberId,
            sourceMemberId,
            targetMemberId,
            note
        }
    };
}
