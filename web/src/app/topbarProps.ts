export type TopbarState = {
  canOpenRoom: boolean;
};

export type TopbarActions = {
  onOpenHome: () => void;
  onOpenMenu: () => void;
  onOpenRoom: () => void;
};

export type TopbarProps = {
  state: TopbarState;
  actions: TopbarActions;
};