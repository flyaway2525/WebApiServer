import { useRoomCoordinator } from './hooks/useRoomCoordinator';
import { useScreenCoordinator } from './hooks/useScreenCoordinator';
import { useSpaces } from './hooks/useSpaces';
import { useTransactions } from './hooks/useTransactions';
import {
  createNavigationViewModel,
  createRoomViewModel,
  createSpacesViewModel,
  createTransactionsViewModel,
  PointManagerAppViewModel
} from './viewModels';

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

  return {
    navigation: createNavigationViewModel(navigation),
    spaces: createSpacesViewModel(spaces),
    transactions: createTransactionsViewModel(transactions),
    room: createRoomViewModel(room)
  };
}