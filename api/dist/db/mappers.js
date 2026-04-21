function toBoolean(value) {
    return Number(value ?? 0) === 1;
}
function parseCapabilities(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    }
    catch {
        return [];
    }
}
export function mapSpaceRow(row) {
    return {
        id: Number(row.id),
        code: String(row.code),
        name: String(row.name),
        kind: row.kind,
        visibility: row.visibility,
        initialPoints: Number(row.initialPoints),
        allowGuestJoin: toBoolean(row.allowGuestJoin),
        rankingMode: row.rankingMode,
        bankCanMint: toBoolean(row.bankCanMint),
        state: row.state,
        closedAt: row.closedAt == null ? null : String(row.closedAt),
        closedByMemberId: row.closedByMemberId == null ? null : Number(row.closedByMemberId),
        createdAt: String(row.createdAt),
        memberCount: Number(row.memberCount ?? 0),
        totalPoints: Number(row.totalPoints ?? 0)
    };
}
export function mapMemberRow(row) {
    const role = row.role;
    return {
        id: Number(row.id),
        spaceId: Number(row.spaceId),
        displayName: String(row.displayName),
        role,
        roleDefinitionId: row.roleDefinitionId == null ? null : Number(row.roleDefinitionId),
        roleKey: row.roleKey == null ? role : String(row.roleKey),
        roleLabel: row.roleLabel == null ? role : String(row.roleLabel),
        capabilities: parseCapabilities(row.capabilitiesJson),
        isGuest: toBoolean(row.isGuest),
        points: Number(row.points),
        canTransfer: toBoolean(row.canTransfer),
        createdAt: String(row.createdAt)
    };
}
export function mapRoleDefinitionRow(row) {
    return {
        id: Number(row.id),
        spaceId: Number(row.spaceId),
        key: String(row.key),
        label: String(row.label),
        description: row.description == null ? null : String(row.description),
        legacyRole: row.legacyRole,
        maxParticipants: row.maxParticipants == null ? null : Number(row.maxParticipants),
        isSystem: toBoolean(row.isSystem),
        capabilities: parseCapabilities(row.capabilitiesJson),
        createdAt: String(row.createdAt)
    };
}
export function mapTransactionRow(row) {
    return {
        id: Number(row.id),
        spaceId: Number(row.spaceId),
        kind: row.kind,
        actorType: row.actorType ?? 'member',
        actorMemberId: row.actorMemberId == null ? null : Number(row.actorMemberId),
        actorDisplayName: row.actorDisplayName == null ? null : String(row.actorDisplayName),
        sourceMemberId: row.sourceMemberId == null ? null : Number(row.sourceMemberId),
        sourceDisplayName: row.sourceDisplayName == null ? null : String(row.sourceDisplayName),
        targetMemberId: row.targetMemberId == null ? null : Number(row.targetMemberId),
        targetDisplayName: row.targetDisplayName == null ? null : String(row.targetDisplayName),
        amount: Number(row.amount),
        note: row.note == null ? null : String(row.note),
        createdAt: String(row.createdAt)
    };
}
export function mapTransactionRequestRow(row) {
    return {
        id: Number(row.id),
        spaceId: Number(row.spaceId),
        kind: row.kind,
        status: row.status,
        requesterMemberId: Number(row.requesterMemberId),
        requesterDisplayName: row.requesterDisplayName == null ? null : String(row.requesterDisplayName),
        sourceMemberId: row.sourceMemberId == null ? null : Number(row.sourceMemberId),
        sourceDisplayName: row.sourceDisplayName == null ? null : String(row.sourceDisplayName),
        targetMemberId: row.targetMemberId == null ? null : Number(row.targetMemberId),
        targetDisplayName: row.targetDisplayName == null ? null : String(row.targetDisplayName),
        amount: Number(row.amount),
        note: row.note == null ? null : String(row.note),
        rejectionReason: row.rejectionReason == null ? null : String(row.rejectionReason),
        approvedTransactionId: row.approvedTransactionId == null ? null : Number(row.approvedTransactionId),
        resolvedAt: row.resolvedAt == null ? null : String(row.resolvedAt),
        resolvedByMemberId: row.resolvedByMemberId == null ? null : Number(row.resolvedByMemberId),
        resolvedByDisplayName: row.resolvedByDisplayName == null ? null : String(row.resolvedByDisplayName),
        createdAt: String(row.createdAt)
    };
}
