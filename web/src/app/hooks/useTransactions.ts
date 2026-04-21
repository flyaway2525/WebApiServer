import { useEffect } from 'react';

import {
  canResolveTransactionRequest,
  syncTransactionFormMembers
} from '../transactions';
import { approveSpaceTransactionRequest, fetchAuthorizedSpaceTransactionRequests, rejectSpaceTransactionRequest } from '../api';
import { Space, SpaceMember, SpaceSession, SpaceTransaction, SpaceTransactionRequest, TransactionForm } from '../types';
import { useLoadTransactionsAction } from './useLoadTransactionsAction';
import { useSubmitTransactionAction } from './useSubmitTransactionAction';
import { useTransactionState } from './useTransactionState';

type UseTransactionsOptions = {
  members: SpaceMember[];
  selectedSpace: Space | null;
  authenticatedMember: SpaceMember | null;
  memberSession: SpaceSession | null;
};

export type TransactionsController = {
  transactions: SpaceTransaction[];
  transactionRequests: SpaceTransactionRequest[];
  transactionForm: TransactionForm;
  loadingTransactions: boolean;
  loadingTransactionRequests: boolean;
  submittingTransaction: boolean;
  resolvingTransactionRequestId: number | null;
  transactionError: string | null;
  transactionRequestError: string | null;
  loadTransactions: (spaceId: number) => Promise<void>;
  loadTransactionRequests: (spaceId: number) => Promise<void>;
  approveTransactionRequest: (spaceId: number | null, requestId: number) => Promise<void>;
  rejectTransactionRequest: (
    spaceId: number | null,
    requestId: number,
    rejectionReason?: string
  ) => Promise<void>;
  canResolveRequest: (item: SpaceTransactionRequest) => boolean;
  updateTransactionForm: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void;
  submitTransactionForm: (
    selectedSpaceId: number | null,
    refreshAfterSubmit: (spaceId: number) => Promise<void>
  ) => Promise<void>;
};

export function useTransactions(options: UseTransactionsOptions): TransactionsController {
  const state = useTransactionState();

  const loadTransactionsAction = useLoadTransactionsAction({
    setLoadingTransactions: state.setLoadingTransactions,
    setTransactionError: state.setTransactionError,
    setTransactions: state.setTransactions
  });

  const submitTransactionAction = useSubmitTransactionAction({
    transactionForm: state.transactionForm,
    authenticatedMember: options.authenticatedMember,
    memberSession: options.memberSession,
    setSubmittingTransaction: state.setSubmittingTransaction,
    setTransactionError: state.setTransactionError,
    setTransactionForm: state.setTransactionForm
  });

  async function loadTransactionRequests(spaceId: number) {
    state.setLoadingTransactionRequests(true);
    state.setTransactionRequestError(null);

    try {
      if (!options.memberSession) {
        throw new Error('申請一覧を取得するには参加セッションが必要です。');
      }

      const data = await fetchAuthorizedSpaceTransactionRequests(spaceId, options.memberSession);
      state.setTransactionRequests(data.items);
    } catch (error) {
      state.setTransactionRequestError(
        error instanceof Error ? error.message : '承認待ち取引の取得に失敗しました。'
      );
    } finally {
      state.setLoadingTransactionRequests(false);
    }
  }

  async function resolveTransactionRequest(
    action: 'approve' | 'reject',
    spaceId: number | null,
    requestId: number,
    rejectionReason?: string
  ) {
    if (!spaceId) {
      state.setTransactionRequestError('スペースを選択してください。');
      return;
    }

    if (!options.memberSession) {
      state.setTransactionRequestError('承認待ち取引を処理するには参加セッションが必要です。');
      return;
    }

    state.setResolvingTransactionRequestId(requestId);
    state.setTransactionRequestError(null);

    try {
      if (action === 'approve') {
        await approveSpaceTransactionRequest(spaceId, requestId, options.memberSession);
      } else {
        await rejectSpaceTransactionRequest(spaceId, requestId, options.memberSession, rejectionReason);
      }

      await Promise.all([loadTransactionsAction.loadTransactions(spaceId, options.memberSession), loadTransactionRequests(spaceId)]);
    } catch (error) {
      state.setTransactionRequestError(
        error instanceof Error ? error.message : '承認待ち取引の更新に失敗しました。'
      );
    } finally {
      state.setResolvingTransactionRequestId(null);
    }
  }

  useEffect(() => {
    if (!options.selectedSpace || options.members.length === 0) {
      return;
    }

    state.setTransactionForm((current) => syncTransactionFormMembers(current, options.members, options.selectedSpace));
  }, [options.members, options.selectedSpace]);

  return {
    transactions: state.transactions,
    transactionRequests: state.transactionRequests,
    transactionForm: state.transactionForm,
    loadingTransactions: state.loadingTransactions,
    loadingTransactionRequests: state.loadingTransactionRequests,
    submittingTransaction: state.submittingTransaction,
    resolvingTransactionRequestId: state.resolvingTransactionRequestId,
    transactionError: state.transactionError,
    transactionRequestError: state.transactionRequestError,
    loadTransactions: (spaceId) => loadTransactionsAction.loadTransactions(spaceId, options.memberSession),
    loadTransactionRequests,
    approveTransactionRequest: async (spaceId, requestId) => resolveTransactionRequest('approve', spaceId, requestId),
    rejectTransactionRequest: async (spaceId, requestId, rejectionReason) =>
      resolveTransactionRequest('reject', spaceId, requestId, rejectionReason),
    canResolveRequest: (item) => canResolveTransactionRequest(item, options.authenticatedMember, options.selectedSpace),
    updateTransactionForm: state.updateTransactionForm,
    submitTransactionForm: submitTransactionAction.submitTransactionForm
  };
}