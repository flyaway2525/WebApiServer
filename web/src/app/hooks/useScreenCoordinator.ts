import { Dispatch, SetStateAction, useState } from 'react';

import { Screen } from '../types';

export type ScreenCoordinator = {
  screen: Screen;
  setScreen: Dispatch<SetStateAction<Screen>>;
  openHome: () => void;
  openMenu: () => void;
  openCreate: () => void;
  openJoin: () => void;
};

export function useScreenCoordinator(): ScreenCoordinator {
  const [screen, setScreen] = useState<Screen>('home');

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