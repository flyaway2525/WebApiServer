export type Screen = 'home' | 'menu' | 'create' | 'join' | 'room';
export type SpaceKind = 'owner' | 'room';
export type SpaceVisibility = 'private' | 'members' | 'public';
export type TransactionKind = 'grant' | 'transfer' | 'consume';
export type TransactionActorType = 'member' | 'system' | 'qr';

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
  createdAt: string;
  memberCount: number;
  totalPoints: number;
};

export type SpaceMember = {
  id: number;
  spaceId: number;
  displayName: string;
  role: 'host' | 'bank' | 'member';
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

export type SpaceForm = {
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: string;
  allowGuestJoin: boolean;
  bankCanMint: boolean;
  hostDisplayName: string;
};

export type JoinForm = {
  code: string;
  displayName: string;
  qrPayload: string;
};

export type TransactionForm = {
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
};

export type InlineNotice = {
  tone: 'success' | 'error' | 'info';
  message: string;
};

export const apiBaseUrl = 'http://localhost:3000';

export const initialSpaceForm: SpaceForm = {
  name: '',
  kind: 'owner',
  visibility: 'members',
  initialPoints: '10000',
  allowGuestJoin: true,
  bankCanMint: true,
  hostDisplayName: ''
};

export const initialJoinForm: JoinForm = {
  code: '',
  displayName: '',
  qrPayload: ''
};

export const initialTransactionForm: TransactionForm = {
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
