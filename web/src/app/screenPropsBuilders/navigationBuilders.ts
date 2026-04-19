import { HomeScreenProps } from '../homeScreenProps';
import { MenuScreenProps } from '../menuScreenProps';
import { TopbarProps } from '../topbarProps';
import { PointManagerNavigationViewModel } from '../viewModels';
import { SharedScreenPropsInput } from './shared';

export function buildHomeScreenProps(navigation: PointManagerNavigationViewModel): HomeScreenProps {
  return {
    state: {},
    actions: {
      onOpenMenu: navigation.openMenu
    }
  };
}

export function buildTopbarProps(input: Pick<SharedScreenPropsInput, 'navigation' | 'spaces' | 'room'>): TopbarProps {
  return {
    state: {
      canOpenRoom: input.spaces.selectedSpace != null
    },
    actions: {
      onOpenHome: input.navigation.openHome,
      onOpenMenu: input.navigation.openMenu,
      onOpenRoom: () => void input.room.openSelectedRoom()
    }
  };
}

export function buildMenuScreenProps(input: Pick<SharedScreenPropsInput, 'navigation' | 'spaces' | 'room'>): MenuScreenProps {
  return {
    state: {
      loadingSpaces: input.spaces.loadingSpaces,
      spacesError: input.spaces.spacesError,
      recentSpaces: input.spaces.recentSpaces
    },
    actions: {
      onOpenCreate: input.navigation.openCreate,
      onOpenJoin: input.navigation.openJoin,
      onOpenRoom: (spaceId) => void input.room.openRoom(spaceId)
    }
  };
}