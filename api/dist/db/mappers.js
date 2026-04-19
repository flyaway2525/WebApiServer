function toBoolean(value) {
    return Number(value ?? 0) === 1;
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
        createdAt: String(row.createdAt),
        memberCount: Number(row.memberCount ?? 0),
        totalPoints: Number(row.totalPoints ?? 0)
    };
}
export function mapMemberRow(row) {
    return {
        id: Number(row.id),
        spaceId: Number(row.spaceId),
        displayName: String(row.displayName),
        role: row.role,
        isGuest: toBoolean(row.isGuest),
        points: Number(row.points),
        canTransfer: toBoolean(row.canTransfer),
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
