import { useState } from 'react';

import { SpaceTransaction, TransactionForm, initialTransactionForm } from '../types';

export function useTransactionState() {
  const [transactions, setTransactions] = useState<SpaceTransaction[]>([]);
  const [transactionForm, setTransactionForm] = useState(initialTransactionForm);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  function updateTransactionForm<K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) {
    setTransactionForm((current) => ({ ...current, [key]: value }));
  }

  return {
    transactions,
    setTransactions,
    transactionForm,
    setTransactionForm,
    loadingTransactions,
    setLoadingTransactions,
    submittingTransaction,
    setSubmittingTransaction,
    transactionError,
    setTransactionError,
    updateTransactionForm
  };
}