import { FormEvent } from 'react';

import { SpacesController } from './useSpaces';
import { TransactionsController } from './useTransactions';
import { Screen } from '../types';

type UseRoomCoordinatorOptions = {
  setScreen: (screen: Screen) => void;
  spaces: SpacesController;
  transactions: TransactionsController;
};

export type RoomCoordinator = {
  openRoom: (spaceId: number) => Promise<void>;
  openSelectedRoom: () => Promise<void>;
  refreshCurrentTransactions: () => Promise<void>;
  approveTransactionRequest: (requestId: number) => Promise<void>;
  rejectTransactionRequest: (requestId: number, rejectionReason?: string) => Promise<void>;
  handleSpaceSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleJoinSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleTransactionSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reloadRoom: (spaceId: number) => Promise<void>;
};

export function useRoomCoordinator(options: UseRoomCoordinatorOptions): RoomCoordinator {
  async function openRoom(spaceId: number) {
    options.spaces.setSelectedSpaceId(spaceId);
    options.setScreen('room');
    await Promise.all([
      options.spaces.loadMembers(spaceId),
      options.transactions.loadTransactions(spaceId),
      options.transactions.loadTransactionRequests(spaceId)
    ]);
  }

  async function openSelectedRoom() {
    if (options.spaces.selectedSpaceId) {
      await openRoom(options.spaces.selectedSpaceId);
    }
  }

  async function refreshCurrentTransactions() {
    if (options.spaces.selectedSpace) {
      await Promise.all([
        options.transactions.loadTransactions(options.spaces.selectedSpace.id),
        options.transactions.loadTransactionRequests(options.spaces.selectedSpace.id)
      ]);
    }
  }

  async function reloadRoom(spaceId: number) {
    await Promise.all([
      options.spaces.loadSpaces(),
      options.spaces.loadMembers(spaceId),
      options.transactions.loadTransactions(spaceId),
      options.transactions.loadTransactionRequests(spaceId)
    ]);
  }

  async function approveTransactionRequest(requestId: number) {
    await options.transactions.approveTransactionRequest(options.spaces.selectedSpaceId, requestId);
  }

  async function rejectTransactionRequest(requestId: number, rejectionReason?: string) {
    await options.transactions.rejectTransactionRequest(options.spaces.selectedSpaceId, requestId, rejectionReason);
  }

  async function handleSpaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const created = await options.spaces.submitSpaceForm();
    if (created) {
      await openRoom(created.id);
    }
  }

  async function handleJoinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const joined = await options.spaces.submitJoinForm();
    if (joined) {
      await openRoom(joined.space.id);
    }
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await options.transactions.submitTransactionForm(options.spaces.selectedSpaceId, reloadRoom);
  }

  return {
    openRoom,
    openSelectedRoom,
    refreshCurrentTransactions,
    approveTransactionRequest,
    rejectTransactionRequest,
    handleSpaceSubmit,
    handleJoinSubmit,
    handleTransactionSubmit,
    reloadRoom
  };
}