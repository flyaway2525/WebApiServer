import { Dispatch, FormEvent, SetStateAction } from 'react';

import { InlineNotice, JoinForm, Screen, Space, SpaceForm, SpaceKind, SpaceMember, SpaceTransaction, TransactionForm } from '../types';

export type PointManagerNavigationViewModel = {
  screen: Screen;
  setScreen: Dispatch<SetStateAction<Screen>>;
  openHome: () => void;
  openMenu: () => void;
  openCreate: () => void;
  openJoin: () => void;
};

export type PointManagerSpacesViewModel = {
  recentSpaces: Space[];
  selectedSpace: Space | null;
  guestSessionMember: SpaceMember | null;
  shareJoinLink: string;
  members: SpaceMember[];
  loadingSpaces: boolean;
  loadingMembers: boolean;
  submittingSpace: boolean;
  submittingJoin: boolean;
  spacesError: string | null;
  createError: string | null;
  joinError: string | null;
  memberError: string | null;
  joinNotice: InlineNotice | null;
  spaceForm: SpaceForm;
  joinForm: JoinForm;
  updateSpaceForm: <K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) => void;
  updateJoinForm: <K extends keyof JoinForm>(key: K, value: JoinForm[K]) => void;
  handleModeChange: (nextKind: SpaceKind) => void;
  applyJoinCodeFromQrPayload: () => void;
};

export type PointManagerTransactionsViewModel = {
  transactions: SpaceTransaction[];
  loadingTransactions: boolean;
  submittingTransaction: boolean;
  transactionError: string | null;
  transactionForm: TransactionForm;
  updateTransactionForm: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void;
};

export type PointManagerRoomViewModel = {
  openRoom: (spaceId: number) => Promise<void>;
  openSelectedRoom: () => Promise<void>;
  refreshCurrentTransactions: () => Promise<void>;
  handleSpaceSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleJoinSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleTransactionSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export type PointManagerAppViewModel = {
  navigation: PointManagerNavigationViewModel;
  spaces: PointManagerSpacesViewModel;
  transactions: PointManagerTransactionsViewModel;
  room: PointManagerRoomViewModel;
};