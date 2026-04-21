import {
  Space,
  SpaceMember,
  SpaceTransaction,
  SpaceTransactionRequest,
  TransactionActorType,
  TransactionForm,
  TransactionKind
} from './types';
import { hasCapability } from './roles';

type PendingTransactionRequestPayload = {
  kind: TransactionKind;
  amount: number;
  sourceMemberId?: number;
  targetMemberId?: number;
  note?: string;
};

type TransactionPayload = {
  kind: TransactionKind;
  amount: number;
  actorType: TransactionActorType;
  actorMemberId?: number;
  sourceMemberId?: number;
  targetMemberId?: number;
  note?: string;
};

type TransactionPayloadResult =
  | { error: string; payload: null }
  | { error: null; payload: TransactionPayload };

type PendingTransactionRequestPayloadResult =
  | { error: string; payload: null }
  | { error: null; payload: PendingTransactionRequestPayload };

export function syncTransactionFormMembers(
  current: TransactionForm,
  members: SpaceMember[],
  selectedSpace: Space | null
) {
  const bankMember = members.find((member) => member.role === 'bank') ?? null;
  const playableMembers = members.filter((member) => member.role !== 'bank');
  const fallbackMember = playableMembers[0] ?? members[0] ?? null;

  return {
    ...current,
    actorMemberId:
      current.actorType === 'member' && members.some((member) => String(member.id) === current.actorMemberId)
        ? current.actorMemberId
        : String(fallbackMember?.id ?? bankMember?.id ?? ''),
    sourceMemberId:
      members.some((member) => String(member.id) === current.sourceMemberId)
        ? current.sourceMemberId
        : selectedSpace?.kind === 'owner'
          ? String(bankMember?.id ?? '')
          : String(fallbackMember?.id ?? ''),
    targetMemberId:
      members.some((member) => String(member.id) === current.targetMemberId)
        ? current.targetMemberId
        : String(fallbackMember?.id ?? '')
  };
}

export function buildTransactionPayload(transactionForm: TransactionForm): TransactionPayloadResult {
  const amount = Number(transactionForm.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: '金額は 1 以上の整数で入力してください。', payload: null };
  }

  const payload: TransactionPayload = {
    kind: transactionForm.kind,
    amount,
    actorType: transactionForm.actorType
  };

  if (transactionForm.actorType === 'member') {
    payload.actorMemberId = Number(transactionForm.actorMemberId);
    if (!Number.isInteger(payload.actorMemberId) || (payload.actorMemberId ?? 0) <= 0) {
      return { error: '実行者を選択してください。', payload: null };
    }
  }

  if (transactionForm.kind === 'grant') {
    if (!transactionForm.targetMemberId) {
      return { error: '配布先を選択してください。', payload: null };
    }

    payload.targetMemberId = Number(transactionForm.targetMemberId);
    if (transactionForm.sourceMemberId) {
      payload.sourceMemberId = Number(transactionForm.sourceMemberId);
    }
  }

  if (transactionForm.kind === 'transfer') {
    if (!transactionForm.sourceMemberId || !transactionForm.targetMemberId) {
      return { error: '譲渡元と譲渡先を選択してください。', payload: null };
    }

    payload.sourceMemberId = Number(transactionForm.sourceMemberId);
    payload.targetMemberId = Number(transactionForm.targetMemberId);
  }

  if (transactionForm.kind === 'consume') {
    if (!transactionForm.sourceMemberId) {
      return { error: '使用元を選択してください。', payload: null };
    }

    payload.sourceMemberId = Number(transactionForm.sourceMemberId);
  }

  if (transactionForm.note.trim()) {
    payload.note = transactionForm.note.trim();
  }

  return { error: null, payload };
}

export function buildPendingTransactionRequestPayload(
  transactionForm: TransactionForm
): PendingTransactionRequestPayloadResult {
  const amount = Number(transactionForm.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: '金額は 1 以上の整数で入力してください。', payload: null };
  }

  const payload: PendingTransactionRequestPayload = {
    kind: transactionForm.kind,
    amount
  };

  if (transactionForm.kind === 'grant') {
    if (!transactionForm.targetMemberId) {
      return { error: '配布先を選択してください。', payload: null };
    }

    payload.targetMemberId = Number(transactionForm.targetMemberId);
    if (transactionForm.sourceMemberId) {
      payload.sourceMemberId = Number(transactionForm.sourceMemberId);
    }
  }

  if (transactionForm.kind === 'transfer') {
    if (!transactionForm.sourceMemberId || !transactionForm.targetMemberId) {
      return { error: '譲渡元と譲渡先を選択してください。', payload: null };
    }

    payload.sourceMemberId = Number(transactionForm.sourceMemberId);
    payload.targetMemberId = Number(transactionForm.targetMemberId);
  }

  if (transactionForm.kind === 'consume') {
    if (!transactionForm.sourceMemberId) {
      return { error: '使用元を選択してください。', payload: null };
    }

    payload.sourceMemberId = Number(transactionForm.sourceMemberId);
  }

  if (transactionForm.note.trim()) {
    payload.note = transactionForm.note.trim();
  }

  return { error: null, payload };
}

export function formatTransactionLabel(item: SpaceTransaction) {
  if (item.kind === 'grant') {
    return item.sourceDisplayName
      ? `${item.sourceDisplayName} から ${item.targetDisplayName ?? 'unknown'} に配布`
      : `${item.targetDisplayName ?? 'unknown'} に新規発行`;
  }

  if (item.kind === 'transfer') {
    return `${item.sourceDisplayName ?? 'unknown'} から ${item.targetDisplayName ?? 'unknown'} に譲渡`;
  }

  return `${item.sourceDisplayName ?? 'unknown'} が使用`;
}

export function formatActorLabel(item: SpaceTransaction) {
  if (item.actorType === 'member') {
    return item.actorDisplayName ? `実行者: ${item.actorDisplayName}` : '実行者: member';
  }

  return `実行者: ${item.actorType}`;
}

export function formatTransactionRequestLabel(item: SpaceTransactionRequest) {
  if (item.kind === 'grant') {
    return item.sourceDisplayName
      ? `${item.sourceDisplayName} から ${item.targetDisplayName ?? 'unknown'} への配布申請`
      : `${item.targetDisplayName ?? 'unknown'} への新規発行申請`;
  }

  if (item.kind === 'transfer') {
    return `${item.sourceDisplayName ?? 'unknown'} から ${item.targetDisplayName ?? 'unknown'} への譲渡申請`;
  }

  return `${item.sourceDisplayName ?? 'unknown'} の使用申請`;
}

export function formatTransactionRequestStatus(item: SpaceTransactionRequest) {
  if (item.status === 'approved') {
    return item.resolvedByDisplayName
      ? `承認済み: ${item.resolvedByDisplayName}`
      : '承認済み';
  }

  if (item.status === 'rejected') {
    return item.resolvedByDisplayName
      ? `却下済み: ${item.resolvedByDisplayName}`
      : '却下済み';
  }

  return '承認待ち';
}

export function canResolveTransactionRequest(
  item: SpaceTransactionRequest,
  authenticatedMember: SpaceMember | null,
  selectedSpace: Space | null
) {
  if (!authenticatedMember || !selectedSpace) {
    return false;
  }

  if (item.status !== 'pending') {
    return false;
  }

  if (hasCapability(authenticatedMember, 'resolveTransactionRequest')) {
    return true;
  }

  return item.sourceMemberId === authenticatedMember.id;
}