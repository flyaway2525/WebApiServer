import {
  PointManagerNavigationViewModel,
  PointManagerRoomViewModel,
  PointManagerSpacesViewModel,
  PointManagerTransactionsViewModel
} from '../viewModels';

export type SharedScreenPropsInput = {
  navigation: PointManagerNavigationViewModel;
  spaces: PointManagerSpacesViewModel;
  transactions: PointManagerTransactionsViewModel;
  room: PointManagerRoomViewModel;
};