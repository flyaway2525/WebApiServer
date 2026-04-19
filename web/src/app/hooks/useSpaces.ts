import { Dispatch, SetStateAction, useEffect } from 'react';

import { useCreateSpaceAction } from './useCreateSpaceAction';
import { useJoinSpaceAction } from './useJoinSpaceAction';
import { useLoadMembersAction } from './useLoadMembersAction';
import { useLoadSpacesAction } from './useLoadSpacesAction';
import { useSpaceState } from './useSpaceState';
import {
  InlineNotice,
  JoinForm,
  JoinResponse,
  Space,
  SpaceForm,
  SpaceKind,
  SpaceMember,
  Screen,
  extractSpaceCode,
  initialSpaceForm,
  normalizeSpaceCode
} from '../types';

export type SpacesController = {
  spaces: Space[];
  members: SpaceMember[];
  selectedSpace: Space | null;
  selectedSpaceId: number | null;
  setSelectedSpaceId: Dispatch<SetStateAction<number | null>>;
  guestSessionMember: SpaceMember | null;
  recentSpaces: Space[];
  shareJoinLink: string;
  spaceForm: SpaceForm;
  joinForm: JoinForm;
  loadingSpaces: boolean;
  loadingMembers: boolean;
  submittingSpace: boolean;
  submittingJoin: boolean;
  spacesError: string | null;
  createError: string | null;
  joinError: string | null;
  memberError: string | null;
  joinNotice: InlineNotice | null;
  loadSpaces: () => Promise<void>;
  loadMembers: (spaceId: number) => Promise<void>;
  updateSpaceForm: <K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) => void;
  updateJoinForm: <K extends keyof JoinForm>(key: K, value: JoinForm[K]) => void;
  handleModeChange: (nextKind: SpaceKind) => void;
  applyJoinCodeFromQrPayload: () => void;
  submitSpaceForm: () => Promise<Space | null>;
  submitJoinForm: () => Promise<JoinResponse | null>;
};

export function useSpaces(setScreen: Dispatch<SetStateAction<Screen>>): SpacesController {
  const state = useSpaceState();

  const loadSpacesAction = useLoadSpacesAction({
    setLoadingSpaces: state.setLoadingSpaces,
    setSpacesError: state.setSpacesError,
    setSpaces: state.setSpaces,
    setSelectedSpaceId: state.setSelectedSpaceId
  });

  const loadMembersAction = useLoadMembersAction({
    setLoadingMembers: state.setLoadingMembers,
    setMemberError: state.setMemberError,
    setMembers: state.setMembers
  });

  const createSpaceAction = useCreateSpaceAction({
    spaceForm: state.spaceForm,
    onCreated: async (created) => {
      state.setSpaceForm({
        ...initialSpaceForm,
        kind: created.kind,
        visibility: created.kind === 'owner' ? 'members' : 'private',
        initialPoints: String(created.initialPoints),
        bankCanMint: created.kind === 'owner'
      });
      await loadSpacesAction.loadSpaces();
    }
  });

  const joinSpaceAction = useJoinSpaceAction({
    joinForm: state.joinForm,
    onJoined: async (joined: JoinResponse) => {
      state.setGuestSessionMember(joined.member);
      state.setJoinForm((current) => ({ ...current, code: '', displayName: '' }));
      state.setJoinNotice({
        tone: 'success',
        message: `${joined.space.name} に ${joined.member.displayName} として参加しました。`
      });
      await loadSpacesAction.loadSpaces();
    }
  });

  useEffect(() => {
    void loadSpacesAction.loadSpaces();

    const urlCode = new URL(window.location.href).searchParams.get('code');
    if (urlCode) {
      const normalizedCode = normalizeSpaceCode(urlCode);
      state.setJoinForm((current) => ({ ...current, code: normalizedCode }));
      state.setJoinNotice({
        tone: 'info',
        message: `共有リンクからスペースコード ${normalizedCode} を読み込みました。表示名を入力すると参加できます。`
      });
      setScreen('join');
    }
  }, [setScreen]);

  function applyJoinCodeFromQrPayload() {
    const code = extractSpaceCode(state.joinForm.qrPayload);

    if (!code) {
      state.setJoinNotice({
        tone: 'error',
        message: 'QR 文字列からスペースコードを抽出できませんでした。ROOM01 や ?code=ROOM01 の形式を使ってください。'
      });
      return;
    }

    state.setJoinForm((current) => ({ ...current, code }));
    state.setJoinNotice({
      tone: 'success',
      message: `QR 文字列からスペースコード ${code} を読み込みました。表示名を入力して参加してください。`
    });
    setScreen('join');
  }

  return {
    spaces: state.spaces,
    members: state.members,
    selectedSpace: state.selectedSpace,
    selectedSpaceId: state.selectedSpaceId,
    setSelectedSpaceId: state.setSelectedSpaceId,
    guestSessionMember: state.guestSessionMember,
    recentSpaces: state.recentSpaces,
    shareJoinLink: state.shareJoinLink,
    spaceForm: state.spaceForm,
    joinForm: state.joinForm,
    loadingSpaces: state.loadingSpaces,
    loadingMembers: state.loadingMembers,
    submittingSpace: createSpaceAction.submittingSpace,
    submittingJoin: joinSpaceAction.submittingJoin,
    spacesError: state.spacesError,
    createError: createSpaceAction.createError,
    joinError: joinSpaceAction.joinError,
    memberError: state.memberError,
    joinNotice: state.joinNotice,
    loadSpaces: loadSpacesAction.loadSpaces,
    loadMembers: loadMembersAction.loadMembers,
    updateSpaceForm: state.updateSpaceForm,
    updateJoinForm: state.updateJoinForm,
    handleModeChange: state.handleModeChange,
    applyJoinCodeFromQrPayload,
    submitSpaceForm: createSpaceAction.submitSpaceForm,
    submitJoinForm: joinSpaceAction.submitJoinForm
  };
}