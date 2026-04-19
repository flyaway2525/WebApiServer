import { useEffect, useRef } from 'react';

import { useRoomCoordinator } from './hooks/useRoomCoordinator';
import { useScreenCoordinator } from './hooks/useScreenCoordinator';
import { useSpaces } from './hooks/useSpaces';
import { useTransactions } from './hooks/useTransactions';
import {
  formatActorLabel,
  formatTransactionLabel,
  formatTransactionRequestLabel,
  formatTransactionRequestStatus
} from './transactions';
import {
  createNavigationViewModel,
  createRoomViewModel,
  createSpacesViewModel,
  createTransactionsViewModel,
  PointManagerAppViewModel
} from './viewModels';

function readScreenFromUrl() {
  if (typeof window === 'undefined') {
    return 'home' as const;
  }

  const query = new URLSearchParams(window.location.search);
  const value = query.get('screen');
  return value === 'menu' || value === 'create' || value === 'join' || value === 'room' ? value : 'home';
}

function readSharedRoomSpaceId() {
  if (typeof window === 'undefined') {
    return null;
  }

  const query = new URLSearchParams(window.location.search);
  const value = Number(query.get('spaceId'));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function syncAppQuery(
  screen: 'home' | 'menu' | 'create' | 'join' | 'room',
  spaceId: number | null,
  joinCode: string
) {
  if (typeof window === 'undefined') {
    return;
  }

  const query = new URLSearchParams(window.location.search);

  if (screen === 'home') {
    query.delete('screen');
  } else {
    query.set('screen', screen);
  }

  if (screen === 'room' && spaceId) {
    query.set('spaceId', String(spaceId));
    query.delete('code');
  } else {
    query.delete('spaceId');
    query.delete('requestTab');
    query.delete('requestStatus');
    query.delete('requestSort');
  }

  if (screen === 'join' && joinCode.trim()) {
    query.set('code', joinCode.trim());
  } else {
    query.delete('code');
  }

  const nextQuery = query.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

export function usePointManagerApp(): PointManagerAppViewModel {
  const navigation = useScreenCoordinator();
  const { setScreen } = navigation;
  const spaces = useSpaces(setScreen);
  const transactions = useTransactions({
    members: spaces.members,
    selectedSpace: spaces.selectedSpace,
    authenticatedMember: spaces.guestSessionMember,
    memberSession: spaces.memberSession
  });
  const room = useRoomCoordinator({ setScreen, spaces, transactions });
  const hasRestoredSharedRoomRef = useRef(false);
  const hasRestoredScreenRef = useRef(false);

  useEffect(() => {
    if (hasRestoredScreenRef.current) {
      return;
    }

    hasRestoredScreenRef.current = true;

    if (typeof window === 'undefined') {
      return;
    }

    const query = new URLSearchParams(window.location.search);
    if (query.get('code')) {
      return;
    }

    const sharedScreen = readScreenFromUrl();
    if (sharedScreen !== 'room' && sharedScreen !== navigation.screen) {
      setScreen(sharedScreen);
    }
  }, [navigation.screen, setScreen]);

  useEffect(() => {
    if (hasRestoredSharedRoomRef.current || spaces.loadingSpaces) {
      return;
    }

    hasRestoredSharedRoomRef.current = true;

    if (typeof window === 'undefined') {
      return;
    }

    const query = new URLSearchParams(window.location.search);
    if (query.get('code')) {
      return;
    }

    if (readScreenFromUrl() !== 'room') {
      return;
    }

    const sharedSpaceId = readSharedRoomSpaceId();
    if (!sharedSpaceId) {
      return;
    }

    if (!spaces.spaces.some((space) => space.id === sharedSpaceId)) {
      return;
    }

    void room.openRoom(sharedSpaceId);
  }, [room, spaces.loadingSpaces, spaces.spaces]);

  useEffect(() => {
    syncAppQuery(navigation.screen, spaces.selectedSpaceId, spaces.joinForm.code);
  }, [navigation.screen, spaces.selectedSpaceId, spaces.joinForm.code]);

  return {
    navigation: createNavigationViewModel(navigation),
    spaces: createSpacesViewModel(spaces),
    transactions: createTransactionsViewModel(transactions),
    room: createRoomViewModel(room),
    formatters: {
      formatTransactionLabel,
      formatActorLabel,
      formatTransactionRequestLabel,
      formatTransactionRequestStatus
    }
  };
}