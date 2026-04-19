import { useState } from 'react';

import { joinSpaceRequest } from '../api';
import { JoinForm, JoinResponse } from '../types';

type UseJoinSpaceActionOptions = {
  joinForm: JoinForm;
  onJoined: (joined: JoinResponse) => Promise<void>;
};

export function useJoinSpaceAction(options: UseJoinSpaceActionOptions) {
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function submitJoinForm() {
    const normalizedCode = options.joinForm.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!normalizedCode) {
      setJoinError('スペースコードを入力してください。');
      return null;
    }

    if (!options.joinForm.displayName.trim()) {
      setJoinError('表示名を入力してください。');
      return null;
    }

    setSubmittingJoin(true);
    setJoinError(null);

    try {
      const joined = await joinSpaceRequest(normalizedCode, options.joinForm.displayName);
      await options.onJoined(joined);
      return joined;
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'スペースへの参加に失敗しました。');
      return null;
    } finally {
      setSubmittingJoin(false);
    }
  }

  return {
    submittingJoin,
    joinError,
    submitJoinForm
  };
}