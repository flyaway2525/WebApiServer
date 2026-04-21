import { useState } from 'react';

import { createSpaceRequest } from '../api';
import { CreateSpaceResponse, SpaceForm } from '../types';

type UseCreateSpaceActionOptions = {
  spaceForm: SpaceForm;
  onCreated: (created: CreateSpaceResponse) => Promise<void>;
};

export function useCreateSpaceAction(options: UseCreateSpaceActionOptions) {
  const [submittingSpace, setSubmittingSpace] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function submitSpaceForm() {
    if (!options.spaceForm.name.trim()) {
      setCreateError('スペース名を入力してください。');
      return null;
    }

    if (!options.spaceForm.hostDisplayName.trim()) {
      setCreateError('ホスト名を入力してください。');
      return null;
    }

    if (!options.spaceForm.rolePreset) {
      setCreateError('ロールプリセットを選択してください。');
      return null;
    }

    setSubmittingSpace(true);
    setCreateError(null);

    try {
      const created = await createSpaceRequest(options.spaceForm);
      await options.onCreated(created);
      return created;
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'スペースの作成に失敗しました。');
      return null;
    } finally {
      setSubmittingSpace(false);
    }
  }

  return {
    submittingSpace,
    createError,
    submitSpaceForm
  };
}