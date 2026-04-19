import { FormEventHandler } from 'react';

import {
  Space,
  SpaceMember,
  SpaceTransaction,
  SpaceTransactionRequest,
  TransactionForm
} from './types';

export type RoomScreenState = {
  selectedSpace: Space | null;
  shareJoinLink: string;
  guestSessionMember: SpaceMember | null;
  members: SpaceMember[];
  transactions: SpaceTransaction[];
  transactionRequests: SpaceTransactionRequest[];
  loadingMembers: boolean;
  loadingTransactions: boolean;
  loadingTransactionRequests: boolean;
  memberError: string | null;
  transactionError: string | null;
  transactionRequestError: string | null;
  transactionForm: TransactionForm;
  submittingTransaction: boolean;
  resolvingTransactionRequestId: number | null;
};

export type RoomScreenActions = {
  onBackToMenu: () => void;
  onOpenJoin: () => void;
  onRefreshTransactions: () => void;
  onApproveTransactionRequest: (requestId: number) => Promise<void>;
  onRejectTransactionRequest: (requestId: number, rejectionReason?: string) => Promise<void>;
  onTransactionFieldChange: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void;
  onSubmitTransaction: FormEventHandler<HTMLFormElement>;
};

export type RoomScreenFormatters = {
  formatTransactionLabel: (item: SpaceTransaction) => string;
  formatActorLabel: (item: SpaceTransaction) => string;
  formatTransactionRequestLabel: (item: SpaceTransactionRequest) => string;
  formatTransactionRequestStatus: (item: SpaceTransactionRequest) => string;
  canResolveTransactionRequest: (item: SpaceTransactionRequest) => boolean;
};

export type RoomScreenProps = {
  state: RoomScreenState;
  actions: RoomScreenActions;
  formatters: RoomScreenFormatters;
};