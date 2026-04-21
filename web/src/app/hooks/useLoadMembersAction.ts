import { fetchAuthorizedSpaceMembers } from '../api';
import { SpaceMember, SpaceSession } from '../types';

type UseLoadMembersActionOptions = {
  setLoadingMembers: (value: boolean) => void;
  setMemberError: (value: string | null) => void;
  setMembers: (value: SpaceMember[]) => void;
};

export function useLoadMembersAction(options: UseLoadMembersActionOptions) {
  async function loadMembers(spaceId: number, memberSession: SpaceSession | null) {
    options.setLoadingMembers(true);
    options.setMemberError(null);

    try {
      if (!memberSession) {
        throw new Error('メンバー一覧を取得するには参加セッションが必要です。');
      }

      const data = await fetchAuthorizedSpaceMembers(spaceId, memberSession);
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