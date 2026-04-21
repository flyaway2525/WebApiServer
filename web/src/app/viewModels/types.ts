import { Dispatch, FormEvent, SetStateAction } from 'react';

import { InlineNotice, JoinForm, Screen, Space, SpaceForm, SpaceKind, SpaceMember, SpaceRoleDefinition, SpaceTransaction, SpaceTransactionRequest, TransactionForm } from '../types';

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
  joinRoleDefinitions: SpaceRoleDefinition[];
  loadingSpaces: boolean;
  loadingMembers: boolean;
  loadingJoinRoleDefinitions: boolean;
  submittingSpace: boolean;
  submittingJoin: boolean;
  spacesError: string | null;
  createError: string | null;
  joinError: string | null;
  memberError: string | null;
  joinRoleDefinitionError: string | null;
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
  transactionRequests: SpaceTransactionRequest[];
  loadingTransactions: boolean;
  loadingTransactionRequests: boolean;
  submittingTransaction: boolean;
  resolvingTransactionRequestId: number | null;
  transactionError: string | null;
  transactionRequestError: string | null;
  transactionForm: TransactionForm;
  canResolveRequest: (item: SpaceTransactionRequest) => boolean;
  updateTransactionForm: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void;
};

export type PointManagerRoomViewModel = {
  openRoom: (spaceId: number) => Promise<void>;
  openSelectedRoom: () => Promise<void>;
  refreshCurrentTransactions: () => Promise<void>;
  approveTransactionRequest: (requestId: number) => Promise<void>;
  rejectTransactionRequest: (requestId: number, rejectionReason?: string) => Promise<void>;
  handleSpaceSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleJoinSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleTransactionSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export type PointManagerAppViewModel = {
  navigation: PointManagerNavigationViewModel;
  spaces: PointManagerSpacesViewModel;
  transactions: PointManagerTransactionsViewModel;
  room: PointManagerRoomViewModel;
  formatters: {
    formatTransactionLabel: (item: SpaceTransaction) => string;
    formatActorLabel: (item: SpaceTransaction) => string;
    formatTransactionRequestLabel: (item: SpaceTransactionRequest) => string;
    formatTransactionRequestStatus: (item: SpaceTransactionRequest) => string;
  };
};