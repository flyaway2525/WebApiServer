import { Dispatch, SetStateAction, useState } from 'react';

import { Screen } from '../types';

function readScreenFromUrl(): Screen {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const query = new URLSearchParams(window.location.search);
  const value = query.get('screen');

  if (value === 'menu' || value === 'create' || value === 'join' || value === 'room' || value === 'home') {
    return value;
  }

  return 'home';
}

export type ScreenCoordinator = {
  screen: Screen;
  setScreen: Dispatch<SetStateAction<Screen>>;
  openHome: () => void;
  openMenu: () => void;
  openCreate: () => void;
  openJoin: () => void;
};

export function useScreenCoordinator(): ScreenCoordinator {
  const [screen, setScreen] = useState<Screen>(readScreenFromUrl);

  function openHome() {
    setScreen('home');
  }

  function openMenu() {
    setScreen('menu');
  }

  function openCreate() {
    setScreen('create');
  }

  function openJoin() {
    setScreen('join');
  }

  return {
    screen,
    setScreen,
    openHome,
    openMenu,
    openCreate,
    openJoin
  };
}