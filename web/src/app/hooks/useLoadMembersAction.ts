import { fetchSpaceMembers } from '../api';
import { SpaceMember } from '../types';

type UseLoadMembersActionOptions = {
  setLoadingMembers: (value: boolean) => void;
  setMemberError: (value: string | null) => void;
  setMembers: (value: SpaceMember[]) => void;
};

export function useLoadMembersAction(options: UseLoadMembersActionOptions) {
  async function loadMembers(spaceId: number) {
    options.setLoadingMembers(true);
    options.setMemberError(null);

    try {
      const data = await fetchSpaceMembers(spaceId);
      options.setMembers(data.items);
    } catch (error) {
      options.setMemberError(error instanceof Error ? error.message : 'メンバー一覧の取得に失敗しました。');
    } finally {
      options.setLoadingMembers(false);
    }
  }

  return {
    loadMembers
  };
}