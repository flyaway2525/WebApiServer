import {
  createAuthorizedPendingTransactionRequest,
  createAuthorizedSpaceTransactionRequest
} from '../api';
import { buildPendingTransactionRequestPayload, buildTransactionPayload } from '../transactions';
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

    if (options.transactionForm.submissionMode === 'request') {
      const requestResult = buildPendingTransactionRequestPayload(options.transactionForm);
      if (requestResult.error || !requestResult.payload) {
        options.setTransactionError(requestResult.error ?? '取引の入力内容を確認してください。');
        return;
      }
    } else {
      const transactionResult = buildTransactionPayload(options.transactionForm);
      if (transactionResult.error || !transactionResult.payload) {
        options.setTransactionError(transactionResult.error ?? '取引の入力内容を確認してください。');
        return;
      }
    }

    options.setSubmittingTransaction(true);
    options.setTransactionError(null);

    try {
      if (options.transactionForm.submissionMode === 'request') {
        const requestResult = buildPendingTransactionRequestPayload(options.transactionForm);
        const requestPayload = requestResult.payload;
        if (!requestPayload) {
          options.setTransactionError(requestResult.error ?? '取引の入力内容を確認してください。');
          return;
        }

        await createAuthorizedPendingTransactionRequest(selectedSpaceId, requestPayload, options.memberSession);
      } else {
        const transactionResult = buildTransactionPayload(options.transactionForm);
        const transactionPayload = transactionResult.payload;
        if (!transactionPayload) {
          options.setTransactionError(transactionResult.error ?? '取引の入力内容を確認してください。');
          return;
        }

        const payload = {
          ...transactionPayload,
          actorType: 'member' as const,
          actorMemberId: options.authenticatedMember.id
        };

        await createAuthorizedSpaceTransactionRequest(selectedSpaceId, payload, options.memberSession);
      }

      await refreshAfterSubmit(selectedSpaceId);
      options.setTransactionForm((current) => ({
        ...current,
        amount: current.kind === 'consume' ? current.amount : '100',
        note: ''
      }));
    } catch (error) {
      options.setTransactionError(
        error instanceof Error
          ? error.message
          : options.transactionForm.submissionMode === 'request'
            ? '承認待ち取引の作成に失敗しました。'
            : '取引の作成に失敗しました。'
      );
    } finally {
      options.setSubmittingTransaction(false);
    }
  }

  return {
    submitTransactionForm
  };
}