import { FormEventHandler } from 'react';

import { SpaceForm, SpaceKind } from './types';

export type CreateScreenState = {
  createError: string | null;
  spaceForm: SpaceForm;
  submittingSpace: boolean;
};

export type CreateScreenActions = {
  onBack: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onModeChange: (nextKind: SpaceKind) => void;
  onFieldChange: <K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) => void;
};

export type CreateScreenProps = {
  state: CreateScreenState;
  actions: CreateScreenActions;
};