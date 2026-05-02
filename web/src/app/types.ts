import { createRandomGuestDisplayName, createRandomHostDisplayName, createRandomSpaceName } from './naming';

export type Screen = 'home' | 'menu' | 'create' | 'join' | 'room';
export type SpaceKind = 'owner' | 'room';
export type SpaceVisibility = 'private' | 'members' | 'public';
export type SpaceRolePresetKey = 'owner-bank' | 'standard-room' | 'tournament-room';
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
export type TransactionKind = 'grant' | 'transfer' | 'consume';
export type TransactionActorType = 'member' | 'system' | 'qr';
export type TransactionSubmissionMode = 'direct' | 'request';
export type TransactionRequestStatus = 'pending' | 'approved' | 'rejected';

export type SpaceRoleDefinition = {
  id: number;
  spaceId: number;
  key: string;
  label: string;
  description: string | null;
  legacyRole: 'host' | 'bank' | 'member';
  maxParticipants: number | null;
  isSystem: boolean;
  capabilities: RoleCapabilityKey[];
  createdAt: string;
};

export type Space = {
  id: number;
  code: string;
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: number;
  allowGuestJoin: boolean;
  rankingMode: 'manual' | 'polling';
  bankCanMint: boolean;
  state: 'active' | 'closed' | 'archived';
  closedAt: string | null;
  closedByMemberId: number | null;
  createdAt: string;
  memberCount: number;
  totalPoints: number;
};

export type SpaceMember = {
  id: number;
  spaceId: number;
  displayName: string;
  role: 'host' | 'bank' | 'member';
  roleDefinitionId: number | null;
  roleKey: string;
  roleLabel: string;
  capabilities: RoleCapabilityKey[];
  isGuest: boolean;
  points: number;
  canTransfer: boolean;
  createdAt: string;
};

export type SpaceTransaction = {
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

export type SpaceTransactionRequest = {
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

export type SpaceForm = {
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  rolePreset: SpaceRolePresetKey;
  initialPoints: string;
  allowGuestJoin: boolean;
  bankCanMint: boolean;
  hostDisplayName: string;
};

export type JoinForm = {
  code: string;
  displayName: string;
  roleKey: string;
  qrPayload: string;
};

export type TransactionForm = {
  submissionMode: TransactionSubmissionMode;
  kind: TransactionKind;
  actorType: TransactionActorType;
  actorMemberId: string;
  sourceMemberId: string;
  targetMemberId: string;
  amount: string;
  note: string;
};

export type JoinResponse = {
  space: Space;
  member: SpaceMember;
  session: SpaceSession;
};

export type CreateSpaceResponse = {
  space: Space;
  member: SpaceMember;
  session: SpaceSession;
};

export type SpaceSession = {
  memberId: number;
  spaceId: number;
  token: string;
  issuedAt: string;
};

export type InlineNotice = {
  tone: 'success' | 'error' | 'info';
  message: string;
};

export const apiBaseUrl = 'http://localhost:3000';

export function createInitialSpaceForm(): SpaceForm {
  return {
    name: createRandomSpaceName(),
    kind: 'owner',
    visibility: 'members',
    rolePreset: 'owner-bank',
    initialPoints: '10000',
    allowGuestJoin: true,
    bankCanMint: true,
    hostDisplayName: createRandomHostDisplayName()
  };
}

export function createInitialJoinForm(): JoinForm {
  return {
    code: '',
    displayName: createRandomGuestDisplayName(),
    roleKey: '',
    qrPayload: ''
  };
}

export const rolePresetOptions: Array<{ value: SpaceRolePresetKey; label: string; kind: SpaceKind }> = [
  { value: 'owner-bank', label: 'Owner + BANK', kind: 'owner' },
  { value: 'standard-room', label: '標準 Room', kind: 'room' },
  { value: 'tournament-room', label: '大会 Room', kind: 'room' }
];

export const initialTransactionForm: TransactionForm = {
  submissionMode: 'direct',
  kind: 'grant',
  actorType: 'member',
  actorMemberId: '',
  sourceMemberId: '',
  targetMemberId: '',
  amount: '100',
  note: ''
};

export function normalizeSpaceCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function looksLikeSpaceCode(value: string) {
  return /^[A-Z0-9]{4,16}$/.test(value);
}

export function extractSpaceCode(value: string) {
  const normalized = normalizeSpaceCode(value);
  if (looksLikeSpaceCode(normalized)) {
    return normalized;
  }

  try {
    const parsedUrl = new URL(value);
    const code = parsedUrl.searchParams.get('code') ?? parsedUrl.searchParams.get('spaceCode');
    if (code && looksLikeSpaceCode(normalizeSpaceCode(code))) {
      return normalizeSpaceCode(code);
    }

    const lastPathSegment = parsedUrl.pathname.split('/').filter(Boolean).at(-1);
    if (lastPathSegment && looksLikeSpaceCode(normalizeSpaceCode(lastPathSegment))) {
      return normalizeSpaceCode(lastPathSegment);
    }
  } catch {
    const regexMatch = value.match(/(?:^|[?&#\s])(?:code|spaceCode)=([A-Z0-9]+)/i);
    if (regexMatch?.[1]) {
      const code = normalizeSpaceCode(regexMatch[1]);
      if (looksLikeSpaceCode(code)) {
        return code;
      }
    }
  }

  return null;
}
