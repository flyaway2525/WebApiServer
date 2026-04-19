import { FormEventHandler } from 'react';

import { InlineNotice, JoinForm } from './types';

export type JoinScreenState = {
  joinError: string | null;
  joinNotice: InlineNotice | null;
  joinForm: JoinForm;
  submittingJoin: boolean;
};

export type JoinScreenActions = {
  onBack: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onFieldChange: <K extends keyof JoinForm>(key: K, value: JoinForm[K]) => void;
  onApplyQrPayload: () => void;
};

export type JoinScreenProps = {
  state: JoinScreenState;
  actions: JoinScreenActions;
};