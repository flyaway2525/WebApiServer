import { Space } from './types';

export type MenuScreenState = {
  loadingSpaces: boolean;
  spacesError: string | null;
  recentSpaces: Space[];
};

export type MenuScreenActions = {
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  onOpenRoom: (spaceId: number) => void;
};

export type MenuScreenProps = {
  state: MenuScreenState;
  actions: MenuScreenActions;
};