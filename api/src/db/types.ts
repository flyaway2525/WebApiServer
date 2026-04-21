export type SpaceKind = 'owner' | 'room';
export type SpaceVisibility = 'private' | 'members' | 'public';
export type RankingMode = 'manual' | 'polling';
export type SpaceRole = 'host' | 'bank' | 'member';
export type RoleCapabilityKey =
  | 'viewMembers'
  | 'viewRanking'
  | 'viewTransactions'
  | 'viewTransactionRequests'
  | 'createTransaction'
  | 'createTransactionRequest'
  | 'resolveTransactionRequest'
  | 'manageSpaceState'
  | 'mintPoints';
export type SpaceRolePresetKey = 'owner-bank' | 'standard-room' | 'tournament-room';
export type SpaceState = 'active' | 'closed' | 'archived';
export type TransactionKind = 'grant' | 'transfer' | 'consume';
export type TransactionActorType = 'member' | 'system' | 'qr';
export type TransactionRequestStatus = 'pending' | 'approved' | 'rejected';

export type TaskRecord = {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
  createdAt: string;
};

export type SpaceRecord = {
  id: number;
  code: string;
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: number;
  allowGuestJoin: boolean;
  rankingMode: RankingMode;
  bankCanMint: boolean;
  state: SpaceState;
  closedAt: string | null;
  closedByMemberId: number | null;
  createdAt: string;
  memberCount: number;
  totalPoints: number;
};

export type SpaceMemberRecord = {
  id: number;
  spaceId: number;
  displayName: string;
  role: SpaceRole;
  roleDefinitionId: number | null;
  roleKey: string;
  roleLabel: string;
  capabilities: RoleCapabilityKey[];
  isGuest: boolean;
  points: number;
  canTransfer: boolean;
  createdAt: string;
};

export type SpaceRoleDefinitionRecord = {
  id: number;
  spaceId: number;
  key: string;
  label: string;
  description: string | null;
  legacyRole: SpaceRole;
  maxParticipants: number | null;
  isSystem: boolean;
  capabilities: RoleCapabilityKey[];
  createdAt: string;
};

export type CreateSpaceRoleDefinitionInput = {
  key: string;
  label: string;
  description?: string;
  legacyRole: SpaceRole;
  maxParticipants?: number;
  isSystem?: boolean;
  capabilities: RoleCapabilityKey[];
};

export type CreateSpaceInput = {
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: number;
  allowGuestJoin: boolean;
  bankCanMint: boolean;
  hostDisplayName: string;
  rolePreset?: SpaceRolePresetKey;
};

export type JoinSpaceInput = {
  code: string;
  displayName: string;
  roleKey?: string;
};

export type SpaceSessionRecord = {
  memberId: number;
  spaceId: number;
  token: string;
  issuedAt: string;
};

export type SpaceSessionResult = {
  space: SpaceRecord;
  member: SpaceMemberRecord;
  session: SpaceSessionRecord;
};

export type JoinSpaceResult = {
  space: SpaceRecord;
  member: SpaceMemberRecord;
  session: SpaceSessionRecord;
};

export type CreateSpaceResult = SpaceSessionResult;

export type SpaceTransactionRecord = {
  id: number;
  spaceId: number;
  kind: TransactionKind;
  actorType: TransactionActorType;
  actorMemberId: number | null;
  actorDisplayName: string | null;
  sourceMemberId: number | null;
  sourceDisplayName: string | null;
  targetMemberId: number | null;
  targetDisplayName: string | null;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type CreateSpaceTransactionInput = {
  kind: TransactionKind;
  amount: number;
  actorType?: TransactionActorType;
  actorMemberId?: number;
  sourceMemberId?: number;
  targetMemberId?: number;
  note?: string;
};

export type SpaceTransactionRequestRecord = {
  id: number;
  spaceId: number;
  kind: TransactionKind;
  status: TransactionRequestStatus;
  requesterMemberId: number;
  requesterDisplayName: string | null;
  sourceMemberId: number | null;
  sourceDisplayName: string | null;
  targetMemberId: number | null;
  targetDisplayName: string | null;
  amount: number;
  note: string | null;
  rejectionReason: string | null;
  approvedTransactionId: number | null;
  resolvedAt: string | null;
  resolvedByMemberId: number | null;
  resolvedByDisplayName: string | null;
  createdAt: string;
};

export type CreateSpaceTransactionRequestInput = {
  kind: TransactionKind;
  amount: number;
  sourceMemberId?: number;
  targetMemberId?: number;
  note?: string;
};

export type UpdateSpaceStateInput = {
  state: SpaceState;
};

export type RejectTransactionRequestInput = {
  rejectionReason?: string;
};