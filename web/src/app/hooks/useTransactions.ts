import { useEffect } from 'react';

import { syncTransactionFormMembers } from '../transactions';
import { Space, SpaceMember, SpaceTransaction, TransactionForm } from '../types';
import { useLoadTransactionsAction } from './useLoadTransactionsAction';
import { useSubmitTransactionAction } from './useSubmitTransactionAction';
import { useTransactionState } from './useTransactionState';

type UseTransactionsOptions = {
  members: SpaceMember[];
  selectedSpace: Space | null;
  authenticatedMember: SpaceMember | null;
  memberSession: import('../types').SpaceSession | null;
};

export type TransactionsController = {
  transactions: SpaceTransaction[];
  transactionForm: TransactionForm;
  loadingTransactions: boolean;
  submittingTransaction: boolean;
  transactionError: string | null;
  loadTransactions: (spaceId: number) => Promise<void>;
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

  useEffect(() => {
    if (!options.selectedSpace || options.members.length === 0) {
      return;
    }

    state.setTransactionForm((current) => syncTransactionFormMembers(current, options.members, options.selectedSpace));
  }, [options.members, options.selectedSpace]);

  return {
    transactions: state.transactions,
    transactionForm: state.transactionForm,
    loadingTransactions: state.loadingTransactions,
    submittingTransaction: state.submittingTransaction,
    transactionError: state.transactionError,
    loadTransactions: loadTransactionsAction.loadTransactions,
    updateTransactionForm: state.updateTransactionForm,
    submitTransactionForm: submitTransactionAction.submitTransactionForm
  };
}