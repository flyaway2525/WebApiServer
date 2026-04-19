import { FormEventHandler } from 'react';

import {
  Space,
  SpaceMember,
  SpaceTransaction,
  TransactionForm
} from './types';

export type RoomScreenState = {
  selectedSpace: Space | null;
  shareJoinLink: string;
  guestSessionMember: SpaceMember | null;
  members: SpaceMember[];
  transactions: SpaceTransaction[];
  loadingMembers: boolean;
  loadingTransactions: boolean;
  memberError: string | null;
  transactionError: string | null;
  transactionForm: TransactionForm;
  submittingTransaction: boolean;
};

export type RoomScreenActions = {
  onBackToMenu: () => void;
  onOpenJoin: () => void;
  onRefreshTransactions: () => void;
  onTransactionFieldChange: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void;
  onSubmitTransaction: FormEventHandler<HTMLFormElement>;
};

export type RoomScreenFormatters = {
  formatTransactionLabel: (item: SpaceTransaction) => string;
  formatActorLabel: (item: SpaceTransaction) => string;
};

export type RoomScreenProps = {
  state: RoomScreenState;
  actions: RoomScreenActions;
  formatters: RoomScreenFormatters;
};