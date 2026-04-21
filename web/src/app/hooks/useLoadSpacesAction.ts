import { fetchSpaces } from '../api';
import { Space, SpaceSession } from '../types';

type UseLoadSpacesActionOptions = {
  setLoadingSpaces: (value: boolean) => void;
  setSpacesError: (value: string | null) => void;
  setSpaces: (value: Space[]) => void;
  setSelectedSpaceId: (value: number | null | ((current: number | null) => number | null)) => void;
};

export function useLoadSpacesAction(options: UseLoadSpacesActionOptions) {
  async function loadSpaces(memberSession?: SpaceSession | null) {
    options.setLoadingSpaces(true);
    options.setSpacesError(null);

    try {
      const data = await fetchSpaces(memberSession);
      options.setSpaces(data.items);
      options.setSelectedSpaceId((current) => {
        if (current && data.items.some((item) => item.id === current)) {
          return current;
        }

        return data.items[0]?.id ?? null;
      });
    } catch (error) {
      options.setSpacesError(error instanceof Error ? error.message : 'スペース一覧の取得に失敗しました。');
    } finally {
      options.setLoadingSpaces(false);
    }
  }

  return {
    loadSpaces
  };
}