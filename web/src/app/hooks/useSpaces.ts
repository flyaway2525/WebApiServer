import { Dispatch, SetStateAction, useEffect } from 'react';

import { fetchSpaceRoleDefinitionsByCode } from '../api';
import { useCreateSpaceAction } from './useCreateSpaceAction';
import { useJoinSpaceAction } from './useJoinSpaceAction';
import { useLoadMembersAction } from './useLoadMembersAction';
import { useLoadSpacesAction } from './useLoadSpacesAction';
import { useSpaceState } from './useSpaceState';
import {
  CreateSpaceResponse,
  InlineNotice,
  JoinForm,
  JoinResponse,
  Space,
  SpaceForm,
  SpaceKind,
  SpaceMember,
  SpaceRoleDefinition,
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
  memberSession: { memberId: number; spaceId: number; token: string; issuedAt: string } | null;
  joinRoleDefinitions: SpaceRoleDefinition[];
  recentSpaces: Space[];
  shareJoinLink: string;
  spaceForm: SpaceForm;
  joinForm: JoinForm;
  loadingSpaces: boolean;
  loadingMembers: boolean;
  loadingJoinRoleDefinitions: boolean;
  submittingSpace: boolean;
  submittingJoin: boolean;
  spacesError: string | null;
  createError: string | null;
  joinError: string | null;
  memberError: string | null;
  joinRoleDefinitionError: string | null;
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
    onCreated: async (created: CreateSpaceResponse) => {
      state.setGuestSessionMember(created.member);
      state.setMemberSession(created.session);
      state.setSpaceForm({
        ...initialSpaceForm,
        kind: created.space.kind,
        visibility: created.space.kind === 'owner' ? 'members' : 'private',
        initialPoints: String(created.space.initialPoints),
        bankCanMint: created.space.kind === 'owner'
      });
      await loadSpacesAction.loadSpaces(created.session);
    }
  });

  const joinSpaceAction = useJoinSpaceAction({
    joinForm: state.joinForm,
    onJoined: async (joined: JoinResponse) => {
      state.setGuestSessionMember(joined.member);
      state.setMemberSession(joined.session);
      state.setJoinForm((current) => ({ ...current, code: '', displayName: '', roleKey: '' }));
      state.setJoinRoleDefinitions([]);
      state.setJoinNotice({
        tone: 'success',
        message: `${joined.space.name} に ${joined.member.displayName} として参加しました。`
      });
      await loadSpacesAction.loadSpaces(joined.session);
    }
  });

  useEffect(() => {
    void loadSpacesAction.loadSpaces(state.memberSession);

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

  useEffect(() => {
    const normalizedCode = normalizeSpaceCode(state.joinForm.code);

    if (!normalizedCode) {
      state.setJoinRoleDefinitions([]);
      state.setJoinRoleDefinitionError(null);
      state.setJoinForm((current) => (current.roleKey ? { ...current, roleKey: '' } : current));
      return;
    }

    let disposed = false;

    async function loadJoinRoleDefinitions() {
      state.setLoadingJoinRoleDefinitions(true);
      state.setJoinRoleDefinitionError(null);

      try {
        const data = await fetchSpaceRoleDefinitionsByCode(normalizedCode, state.memberSession);
        if (disposed) {
          return;
        }

        const joinableRoles = data.items.filter((item) => !item.isSystem);
        state.setJoinRoleDefinitions(joinableRoles);
        state.setJoinForm((current) => {
          if (joinableRoles.some((item) => item.key === current.roleKey)) {
            return current;
          }

          return { ...current, roleKey: joinableRoles[0]?.key ?? '' };
        });
      } catch (error) {
        if (disposed) {
          return;
        }

        state.setJoinRoleDefinitions([]);
        state.setJoinRoleDefinitionError(error instanceof Error ? error.message : '参加ロールの取得に失敗しました。');
      } finally {
        if (!disposed) {
          state.setLoadingJoinRoleDefinitions(false);
        }
      }
    }

    void loadJoinRoleDefinitions();

    return () => {
      disposed = true;
    };
  }, [state.joinForm.code, state.memberSession]);

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
    memberSession: state.memberSession,
    joinRoleDefinitions: state.joinRoleDefinitions,
    recentSpaces: state.recentSpaces,
    shareJoinLink: state.shareJoinLink,
    spaceForm: state.spaceForm,
    joinForm: state.joinForm,
    loadingSpaces: state.loadingSpaces,
    loadingMembers: state.loadingMembers,
    loadingJoinRoleDefinitions: state.loadingJoinRoleDefinitions,
    submittingSpace: createSpaceAction.submittingSpace,
    submittingJoin: joinSpaceAction.submittingJoin,
    spacesError: state.spacesError,
    createError: createSpaceAction.createError,
    joinError: joinSpaceAction.joinError,
    memberError: state.memberError,
    joinRoleDefinitionError: state.joinRoleDefinitionError,
    joinNotice: state.joinNotice,
    loadSpaces: () => loadSpacesAction.loadSpaces(state.memberSession),
    loadMembers: (spaceId) => loadMembersAction.loadMembers(spaceId, state.memberSession),
    updateSpaceForm: state.updateSpaceForm,
    updateJoinForm: state.updateJoinForm,
    handleModeChange: state.handleModeChange,
    applyJoinCodeFromQrPayload,
    submitSpaceForm: async () => {
      const created = await createSpaceAction.submitSpaceForm();
      return created?.space ?? null;
    },
    submitJoinForm: joinSpaceAction.submitJoinForm
  };
}