export type HomeScreenState = Record<string, never>;

export type HomeScreenActions = {
  onOpenMenu: () => void;
};

export type HomeScreenProps = {
  state: HomeScreenState;
  actions: HomeScreenActions;
};