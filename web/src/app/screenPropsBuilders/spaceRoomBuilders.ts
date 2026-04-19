import { CreateScreenProps } from '../createScreenProps';
import { JoinScreenProps } from '../joinScreenProps';
import { RoomScreenProps } from '../roomScreenProps';
import { SharedScreenPropsInput } from './shared';

type RoomFormatterInput = {
  formatTransactionLabel: RoomScreenProps['formatters']['formatTransactionLabel'];
  formatActorLabel: RoomScreenProps['formatters']['formatActorLabel'];
};

export function buildCreateScreenProps(input: Pick<SharedScreenPropsInput, 'navigation' | 'spaces' | 'room'>): CreateScreenProps {
  return {
    state: {
      createError: input.spaces.createError,
      spaceForm: input.spaces.spaceForm,
      submittingSpace: input.spaces.submittingSpace
    },
    actions: {
      onBack: input.navigation.openMenu,
      onSubmit: input.room.handleSpaceSubmit,
      onModeChange: input.spaces.handleModeChange,
      onFieldChange: input.spaces.updateSpaceForm
    }
  };
}

export function buildJoinScreenProps(input: Pick<SharedScreenPropsInput, 'navigation' | 'spaces' | 'room'>): JoinScreenProps {
  return {
    state: {
      joinError: input.spaces.joinError,
      joinNotice: input.spaces.joinNotice,
      joinForm: input.spaces.joinForm,
      submittingJoin: input.spaces.submittingJoin
    },
    actions: {
      onBack: input.navigation.openMenu,
      onSubmit: input.room.handleJoinSubmit,
      onFieldChange: input.spaces.updateJoinForm,
      onApplyQrPayload: input.spaces.applyJoinCodeFromQrPayload
    }
  };
}

export function buildRoomScreenProps(
  input: SharedScreenPropsInput,
  formatters: RoomFormatterInput
): RoomScreenProps {
  return {
    state: {
      selectedSpace: input.spaces.selectedSpace,
      shareJoinLink: input.spaces.shareJoinLink,
      guestSessionMember: input.spaces.guestSessionMember,
      members: input.spaces.members,
      transactions: input.transactions.transactions,
      loadingMembers: input.spaces.loadingMembers,
      loadingTransactions: input.transactions.loadingTransactions,
      memberError: input.spaces.memberError,
      transactionError: input.transactions.transactionError,
      transactionForm: input.transactions.transactionForm,
      submittingTransaction: input.transactions.submittingTransaction
    },
    actions: {
      onBackToMenu: input.navigation.openMenu,
      onOpenJoin: input.navigation.openJoin,
      onRefreshTransactions: () => void input.room.refreshCurrentTransactions(),
      onTransactionFieldChange: input.transactions.updateTransactionForm,
      onSubmitTransaction: input.room.handleTransactionSubmit
    },
    formatters
  };
}