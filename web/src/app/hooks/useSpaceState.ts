import { useState } from 'react';

import {
  InlineNotice,
  JoinForm,
  Space,
  SpaceForm,
  SpaceKind,
  SpaceMember,
  SpaceRoleDefinition,
  SpaceSession,
  initialJoinForm,
  initialSpaceForm
} from '../types';

export function useSpaceState() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [guestSessionMember, setGuestSessionMember] = useState<SpaceMember | null>(null);
  const [memberSession, setMemberSession] = useState<SpaceSession | null>(null);
  const [joinRoleDefinitions, setJoinRoleDefinitions] = useState<SpaceRoleDefinition[]>([]);
  const [spaceForm, setSpaceForm] = useState(initialSpaceForm);
  const [joinForm, setJoinForm] = useState(initialJoinForm);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingJoinRoleDefinitions, setLoadingJoinRoleDefinitions] = useState(false);
  const [spacesError, setSpacesError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [joinRoleDefinitionError, setJoinRoleDefinitionError] = useState<string | null>(null);
  const [joinNotice, setJoinNotice] = useState<InlineNotice | null>(null);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const recentSpaces = spaces.slice(0, 4);
  const shareJoinLink = selectedSpace
    ? `${window.location.origin}?code=${encodeURIComponent(selectedSpace.code)}`
    : '';

  function updateSpaceForm<K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) {
    setSpaceForm((current) => ({ ...current, [key]: value }));
  }

  function updateJoinForm<K extends keyof JoinForm>(key: K, value: JoinForm[K]) {
    setJoinForm((current) => ({ ...current, [key]: value }));
  }

  function handleModeChange(nextKind: SpaceKind) {
    updateSpaceForm('kind', nextKind);
    updateSpaceForm('visibility', nextKind === 'owner' ? 'members' : 'private');
    updateSpaceForm('rolePreset', nextKind === 'owner' ? 'owner-bank' : 'standard-room');
    updateSpaceForm('bankCanMint', nextKind === 'owner');
    updateSpaceForm('initialPoints', nextKind === 'owner' ? '10000' : '8000');
  }

  return {
    spaces,
    setSpaces,
    members,
    setMembers,
    selectedSpace,
    selectedSpaceId,
    setSelectedSpaceId,
    guestSessionMember,
    setGuestSessionMember,
    memberSession,
    setMemberSession,
    joinRoleDefinitions,
    setJoinRoleDefinitions,
    recentSpaces,
    shareJoinLink,
    spaceForm,
    setSpaceForm,
    joinForm,
    setJoinForm,
    loadingSpaces,
    setLoadingSpaces,
    loadingMembers,
    setLoadingMembers,
    loadingJoinRoleDefinitions,
    setLoadingJoinRoleDefinitions,
    spacesError,
    setSpacesError,
    memberError,
    setMemberError,
    joinRoleDefinitionError,
    setJoinRoleDefinitionError,
    joinNotice,
    setJoinNotice,
    updateSpaceForm,
    updateJoinForm,
    handleModeChange
  };
}