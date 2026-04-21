import { fetchAuthorizedSpaceTransactions } from '../api';
import { SpaceSession, SpaceTransaction } from '../types';

type UseLoadTransactionsActionOptions = {
  setLoadingTransactions: (value: boolean) => void;
  setTransactionError: (value: string | null) => void;
  setTransactions: (value: SpaceTransaction[]) => void;
};

export function useLoadTransactionsAction(options: UseLoadTransactionsActionOptions) {
  async function loadTransactions(spaceId: number, memberSession: SpaceSession | null) {
    options.setLoadingTransactions(true);
    options.setTransactionError(null);

    try {
      if (!memberSession) {
        throw new Error('取引履歴を取得するには参加セッションが必要です。');
      }

      const data = await fetchAuthorizedSpaceTransactions(spaceId, memberSession);
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