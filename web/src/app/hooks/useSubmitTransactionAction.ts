import { createAuthorizedSpaceTransactionRequest } from '../api';
import { buildTransactionPayload } from '../transactions';
import { SpaceMember, SpaceSession, TransactionForm } from '../types';

type UseSubmitTransactionActionOptions = {
  transactionForm: TransactionForm;
  authenticatedMember: SpaceMember | null;
  memberSession: SpaceSession | null;
  setSubmittingTransaction: (value: boolean) => void;
  setTransactionError: (value: string | null) => void;
  setTransactionForm: (value: TransactionForm | ((current: TransactionForm) => TransactionForm)) => void;
};

export function useSubmitTransactionAction(options: UseSubmitTransactionActionOptions) {
  async function submitTransactionForm(
    selectedSpaceId: number | null,
    refreshAfterSubmit: (spaceId: number) => Promise<void>
  ) {
    if (!selectedSpaceId) {
      options.setTransactionError('スペースを選択してください。');
      return;
    }

    if (!options.authenticatedMember || !options.memberSession) {
      options.setTransactionError('このスペースで操作するには、作成または参加したセッションが必要です。');
      return;
    }

    const result = buildTransactionPayload(options.transactionForm);
    if (result.error) {
      options.setTransactionError(result.error);
      return;
    }

    const payload = result.payload;
    if (!payload) {
      options.setTransactionError('取引の入力内容を確認してください。');
      return;
    }

    payload.actorType = 'member';
    payload.actorMemberId = options.authenticatedMember.id;

    options.setSubmittingTransaction(true);
    options.setTransactionError(null);

    try {
      await createAuthorizedSpaceTransactionRequest(selectedSpaceId, payload, options.memberSession);
      await refreshAfterSubmit(selectedSpaceId);
      options.setTransactionForm((current) => ({
        ...current,
        amount: current.kind === 'consume' ? current.amount : '100',
        note: ''
      }));
    } catch (error) {
      options.setTransactionError(error instanceof Error ? error.message : '取引の作成に失敗しました。');
    } finally {
      options.setSubmittingTransaction(false);
    }
  }

  return {
    submitTransactionForm
  };
}