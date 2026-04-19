import { useState } from 'react';

import { SpaceTransaction, SpaceTransactionRequest, TransactionForm, initialTransactionForm } from '../types';

export function useTransactionState() {
  const [transactions, setTransactions] = useState<SpaceTransaction[]>([]);
  const [transactionRequests, setTransactionRequests] = useState<SpaceTransactionRequest[]>([]);
  const [transactionForm, setTransactionForm] = useState(initialTransactionForm);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingTransactionRequests, setLoadingTransactionRequests] = useState(false);
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  const [resolvingTransactionRequestId, setResolvingTransactionRequestId] = useState<number | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionRequestError, setTransactionRequestError] = useState<string | null>(null);

  function updateTransactionForm<K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) {
    setTransactionForm((current) => ({ ...current, [key]: value }));
  }

  return {
    transactions,
    setTransactions,
    transactionRequests,
    setTransactionRequests,
    transactionForm,
    setTransactionForm,
    loadingTransactions,
    setLoadingTransactions,
    loadingTransactionRequests,
    setLoadingTransactionRequests,
    submittingTransaction,
    setSubmittingTransaction,
    resolvingTransactionRequestId,
    setResolvingTransactionRequestId,
    transactionError,
    setTransactionError,
    transactionRequestError,
    setTransactionRequestError,
    updateTransactionForm
  };
}