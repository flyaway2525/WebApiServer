import {
  RankingMode,
  SpaceKind,
  SpaceMemberRecord,
  SpaceRecord,
  SpaceRole,
  SpaceState,
  SpaceTransactionRecord,
  SpaceTransactionRequestRecord,
  SpaceVisibility,
  TransactionActorType,
  TransactionRequestStatus,
  TransactionKind
} from './types.js';

function toBoolean(value: unknown) {
  return Number(value ?? 0) === 1;
}

export function mapSpaceRow(row: Record<string, unknown>): SpaceRecord {
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
    state: row.state as SpaceState,
    closedAt: row.closedAt == null ? null : String(row.closedAt),
    closedByMemberId: row.closedByMemberId == null ? null : Number(row.closedByMemberId),
    createdAt: String(row.createdAt),
    memberCount: Number(row.memberCount ?? 0),
    totalPoints: Number(row.totalPoints ?? 0)
  };
}

export function mapMemberRow(row: Record<string, unknown>): SpaceMemberRecord {
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

export function mapTransactionRow(row: Record<string, unknown>): SpaceTransactionRecord {
  return {
    id: Number(row.id),
    spaceId: Number(row.spaceId),
    kind: row.kind as TransactionKind,
    actorType: (row.actorType as TransactionActorType | null) ?? 'member',
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

export function mapTransactionRequestRow(row: Record<string, unknown>): SpaceTransactionRequestRecord {
  return {
    id: Number(row.id),
    spaceId: Number(row.spaceId),
    kind: row.kind as TransactionKind,
    status: row.status as TransactionRequestStatus,
    requesterMemberId: Number(row.requesterMemberId),
    requesterDisplayName: row.requesterDisplayName == null ? null : String(row.requesterDisplayName),
    sourceMemberId: row.sourceMemberId == null ? null : Number(row.sourceMemberId),
    sourceDisplayName: row.sourceDisplayName == null ? null : String(row.sourceDisplayName),
    targetMemberId: row.targetMemberId == null ? null : Number(row.targetMemberId),
    targetDisplayName: row.targetDisplayName == null ? null : String(row.targetDisplayName),
    amount: Number(row.amount),
    note: row.note == null ? null : String(row.note),
    approvedTransactionId: row.approvedTransactionId == null ? null : Number(row.approvedTransactionId),
    resolvedAt: row.resolvedAt == null ? null : String(row.resolvedAt),
    resolvedByMemberId: row.resolvedByMemberId == null ? null : Number(row.resolvedByMemberId),
    resolvedByDisplayName: row.resolvedByDisplayName == null ? null : String(row.resolvedByDisplayName),
    createdAt: String(row.createdAt)
  };
}