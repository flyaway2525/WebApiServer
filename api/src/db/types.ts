export type SpaceKind = 'owner' | 'room';
export type SpaceVisibility = 'private' | 'members' | 'public';
export type RankingMode = 'manual' | 'polling';
export type SpaceRole = 'host' | 'bank' | 'member';
export type TransactionKind = 'grant' | 'transfer' | 'consume';
export type TransactionActorType = 'member' | 'system' | 'qr';

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
  createdAt: string;
  memberCount: number;
  totalPoints: number;
};

export type SpaceMemberRecord = {
  id: number;
  spaceId: number;
  displayName: string;
  role: SpaceRole;
  isGuest: boolean;
  points: number;
  canTransfer: boolean;
  createdAt: string;
};

export type CreateSpaceInput = {
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: number;
  allowGuestJoin: boolean;
  bankCanMint: boolean;
  hostDisplayName: string;
};

export type JoinSpaceInput = {
  code: string;
  displayName: string;
};

export type JoinSpaceResult = {
  space: SpaceRecord;
  member: SpaceMemberRecord;
};

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