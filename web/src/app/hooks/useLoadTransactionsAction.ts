import { fetchSpaceTransactions } from '../api';
import { SpaceTransaction } from '../types';

type UseLoadTransactionsActionOptions = {
  setLoadingTransactions: (value: boolean) => void;
  setTransactionError: (value: string | null) => void;
  setTransactions: (value: SpaceTransaction[]) => void;
};

export function useLoadTransactionsAction(options: UseLoadTransactionsActionOptions) {
  async function loadTransactions(spaceId: number) {
    options.setLoadingTransactions(true);
    options.setTransactionError(null);

    try {
      const data = await fetchSpaceTransactions(spaceId);
      options.setTransactions(data.items);
    } catch (error) {
      options.setTransactionError(error instanceof Error ? error.message : '取引履歴の取得に失敗しました。');
    } finally {
      options.setLoadingTransactions(false);
    }
  }

  return {
    loadTransactions
  };
}