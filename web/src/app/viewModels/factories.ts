import { RoomCoordinator } from '../hooks/useRoomCoordinator';
import { ScreenCoordinator } from '../hooks/useScreenCoordinator';
import { SpacesController } from '../hooks/useSpaces';
import { TransactionsController } from '../hooks/useTransactions';
import {
  PointManagerNavigationViewModel,
  PointManagerRoomViewModel,
  PointManagerSpacesViewModel,
  PointManagerTransactionsViewModel
} from './types';

export function createNavigationViewModel(coordinator: ScreenCoordinator): PointManagerNavigationViewModel {
  return {
    screen: coordinator.screen,
    setScreen: coordinator.setScreen,
    openHome: coordinator.openHome,
    openMenu: coordinator.openMenu,
    openCreate: coordinator.openCreate,
    openJoin: coordinator.openJoin
  };
}

export function createSpacesViewModel(controller: SpacesController): PointManagerSpacesViewModel {
  return {
    recentSpaces: controller.recentSpaces,
    selectedSpace: controller.selectedSpace,
    guestSessionMember: controller.guestSessionMember,
    shareJoinLink: controller.shareJoinLink,
    members: controller.members,
    joinRoleDefinitions: controller.joinRoleDefinitions,
    loadingSpaces: controller.loadingSpaces,
    loadingMembers: controller.loadingMembers,
    loadingJoinRoleDefinitions: controller.loadingJoinRoleDefinitions,
    submittingSpace: controller.submittingSpace,
    submittingJoin: controller.submittingJoin,
    spacesError: controller.spacesError,
    createError: controller.createError,
    joinError: controller.joinError,
    memberError: controller.memberError,
    joinRoleDefinitionError: controller.joinRoleDefinitionError,
    joinNotice: controller.joinNotice,
    spaceForm: controller.spaceForm,
    joinForm: controller.joinForm,
    updateSpaceForm: controller.updateSpaceForm,
    updateJoinForm: controller.updateJoinForm,
    handleModeChange: controller.handleModeChange,
    applyJoinCodeFromQrPayload: controller.applyJoinCodeFromQrPayload
  };
}

export function createTransactionsViewModel(controller: TransactionsController): PointManagerTransactionsViewModel {
  return {
    transactions: controller.transactions,
    transactionRequests: controller.transactionRequests,
    loadingTransactions: controller.loadingTransactions,
    loadingTransactionRequests: controller.loadingTransactionRequests,
    submittingTransaction: controller.submittingTransaction,
    resolvingTransactionRequestId: controller.resolvingTransactionRequestId,
    transactionError: controller.transactionError,
    transactionRequestError: controller.transactionRequestError,
    transactionForm: controller.transactionForm,
    canResolveRequest: controller.canResolveRequest,
    updateTransactionForm: controller.updateTransactionForm
  };
}

export function createRoomViewModel(coordinator: RoomCoordinator): PointManagerRoomViewModel {
  return {
    openRoom: coordinator.openRoom,
    openSelectedRoom: coordinator.openSelectedRoom,
    refreshCurrentTransactions: coordinator.refreshCurrentTransactions,
    approveTransactionRequest: coordinator.approveTransactionRequest,
    rejectTransactionRequest: coordinator.rejectTransactionRequest,
    handleSpaceSubmit: coordinator.handleSpaceSubmit,
    handleJoinSubmit: coordinator.handleJoinSubmit,
    handleTransactionSubmit: coordinator.handleTransactionSubmit
  };
}