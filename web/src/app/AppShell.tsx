import { FormEvent, useEffect, useState } from 'react';

import { CreateScreen, HomeScreen, JoinScreen, MenuScreen, RoomScreen, Topbar } from './screens';
import {
  InlineNotice,
  JoinForm,
  JoinResponse,
  Space,
  SpaceForm,
  SpaceKind,
  SpaceMember,
  SpaceTransaction,
  TransactionForm,
  TransactionKind,
  TransactionActorType,
  apiBaseUrl,
  extractSpaceCode,
  initialJoinForm,
  initialSpaceForm,
  initialTransactionForm,
  normalizeSpaceCode,
  Screen
} from './types';

export default function AppShell() {
  const [screen, setScreen] = useState<Screen>('home');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [transactions, setTransactions] = useState<SpaceTransaction[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [guestSessionMember, setGuestSessionMember] = useState<SpaceMember | null>(null);
  const [spaceForm, setSpaceForm] = useState(initialSpaceForm);
  const [joinForm, setJoinForm] = useState(initialJoinForm);
  const [transactionForm, setTransactionForm] = useState(initialTransactionForm);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [submittingSpace, setSubmittingSpace] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  const [spacesError, setSpacesError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [joinNotice, setJoinNotice] = useState<InlineNotice | null>(null);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const recentSpaces = spaces.slice(0, 4);
  const shareJoinLink = selectedSpace
    ? `${window.location.origin}?code=${encodeURIComponent(selectedSpace.code)}`
    : '';

  useEffect(() => {
    void loadSpaces();

    const urlCode = new URL(window.location.href).searchParams.get('code');
    if (urlCode) {
      const normalizedCode = normalizeSpaceCode(urlCode);
      setJoinForm((current) => ({ ...current, code: normalizedCode }));
      setJoinNotice({
        tone: 'info',
        message: `共有リンクからスペースコード ${normalizedCode} を読み込みました。表示名を入力すると参加できます。`
      });
      setScreen('join');
    }
  }, []);

  useEffect(() => {
    if (!selectedSpace || members.length === 0) {
      return;
    }

    const bankMember = members.find((member) => member.role === 'bank') ?? null;
    const playableMembers = members.filter((member) => member.role !== 'bank');
    const fallbackMember = playableMembers[0] ?? members[0] ?? null;

    setTransactionForm((current) => ({
      ...current,
      actorMemberId:
        current.actorType === 'member' && members.some((member) => String(member.id) === current.actorMemberId)
          ? current.actorMemberId
          : String(fallbackMember?.id ?? bankMember?.id ?? ''),
      sourceMemberId:
        members.some((member) => String(member.id) === current.sourceMemberId)
          ? current.sourceMemberId
          : selectedSpace.kind === 'owner'
            ? String(bankMember?.id ?? '')
            : String(fallbackMember?.id ?? ''),
      targetMemberId:
        members.some((member) => String(member.id) === current.targetMemberId)
          ? current.targetMemberId
          : String(fallbackMember?.id ?? '')
    }));
  }, [members, selectedSpace]);

  async function loadSpaces() {
    setLoadingSpaces(true);
    setSpacesError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/spaces`);
      if (!response.ok) {
        throw new Error('スペース一覧の取得に失敗しました。');
      }

      const data = (await response.json()) as { items: Space[] };
      setSpaces(data.items);
      setSelectedSpaceId((current) => {
        if (current && data.items.some((item) => item.id === current)) {
          return current;
        }

        return data.items[0]?.id ?? null;
      });
    } catch (error) {
      setSpacesError(error instanceof Error ? error.message : 'スペース一覧の取得に失敗しました。');
    } finally {
      setLoadingSpaces(false);
    }
  }

  async function loadMembers(spaceId: number) {
    setLoadingMembers(true);
    setMemberError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/members`);
      if (!response.ok) {
        throw new Error('メンバー一覧の取得に失敗しました。');
      }

      const data = (await response.json()) as { items: SpaceMember[] };
      setMembers(data.items);
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : 'メンバー一覧の取得に失敗しました。');
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadTransactions(spaceId: number) {
    setLoadingTransactions(true);
    setTransactionError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/spaces/${spaceId}/transactions`);
      if (!response.ok) {
        throw new Error('取引履歴の取得に失敗しました。');
      }

      const data = (await response.json()) as { items: SpaceTransaction[] };
      setTransactions(data.items);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : '取引履歴の取得に失敗しました。');
    } finally {
      setLoadingTransactions(false);
    }
  }

  async function openRoom(spaceId: number) {
    setSelectedSpaceId(spaceId);
    setScreen('room');
    await Promise.all([loadMembers(spaceId), loadTransactions(spaceId)]);
  }

  function updateSpaceForm<K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) {
    setSpaceForm((current) => ({ ...current, [key]: value }));
  }

  function updateJoinForm<K extends keyof JoinForm>(key: K, value: JoinForm[K]) {
    setJoinForm((current) => ({ ...current, [key]: value }));
  }

  function updateTransactionForm<K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) {
    setTransactionForm((current) => ({ ...current, [key]: value }));
  }

  function handleModeChange(nextKind: SpaceKind) {
    updateSpaceForm('kind', nextKind);
    updateSpaceForm('visibility', nextKind === 'owner' ? 'members' : 'private');
    updateSpaceForm('bankCanMint', nextKind === 'owner');
    updateSpaceForm('initialPoints', nextKind === 'owner' ? '10000' : '8000');
  }

  function applyJoinCodeFromQrPayload() {
    const code = extractSpaceCode(joinForm.qrPayload);

    if (!code) {
      setJoinNotice({
        tone: 'error',
        message: 'QR 文字列からスペースコードを抽出できませんでした。ROOM01 や ?code=ROOM01 の形式を使ってください。'
      });
      return;
    }

    setJoinForm((current) => ({ ...current, code }));
    setJoinNotice({
      tone: 'success',
      message: `QR 文字列からスペースコード ${code} を読み込みました。表示名を入力して参加してください。`
    });
    setScreen('join');
  }

  async function handleSpaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spaceForm.name.trim()) {
      setCreateError('スペース名を入力してください。');
      return;
    }

    if (!spaceForm.hostDisplayName.trim()) {
      setCreateError('ホスト名を入力してください。');
      return;
    }

    setSubmittingSpace(true);
    setCreateError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/spaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: spaceForm.name,
          kind: spaceForm.kind,
          visibility: spaceForm.visibility,
          initialPoints: Number(spaceForm.initialPoints),
          allowGuestJoin: spaceForm.allowGuestJoin,
          bankCanMint: spaceForm.kind === 'owner' ? spaceForm.bankCanMint : false,
          hostDisplayName: spaceForm.hostDisplayName
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? 'スペースの作成に失敗しました。');
      }

      const created = (await response.json()) as Space;
      setSpaceForm({
        ...initialSpaceForm,
        kind: created.kind,
        visibility: created.kind === 'owner' ? 'members' : 'private',
        initialPoints: String(created.initialPoints),
        bankCanMint: created.kind === 'owner'
      });
      await loadSpaces();
      await openRoom(created.id);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'スペースの作成に失敗しました。');
    } finally {
      setSubmittingSpace(false);
    }
  }

  async function handleJoinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = normalizeSpaceCode(joinForm.code);
    if (!normalizedCode) {
      setJoinError('スペースコードを入力してください。');
      return;
    }

    if (!joinForm.displayName.trim()) {
      setJoinError('表示名を入力してください。');
      return;
    }

    setSubmittingJoin(true);
    setJoinError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/spaces/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode, displayName: joinForm.displayName })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? 'スペースへの参加に失敗しました。');
      }

      const joined = (await response.json()) as JoinResponse;
      setGuestSessionMember(joined.member);
      setJoinForm((current) => ({ ...current, code: '', displayName: '' }));
      setJoinNotice({
        tone: 'success',
        message: `${joined.space.name} に ${joined.member.displayName} として参加しました。`
      });
      await loadSpaces();
      await openRoom(joined.space.id);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'スペースへの参加に失敗しました。');
    } finally {
      setSubmittingJoin(false);
    }
  }

  async function handleTransactionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId) {
      setTransactionError('スペースを選択してください。');
      return;
    }

    const amount = Number(transactionForm.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setTransactionError('金額は 1 以上の整数で入力してください。');
      return;
    }

    const payload: {
      kind: TransactionKind;
      amount: number;
      actorType: TransactionActorType;
      actorMemberId?: number;
      sourceMemberId?: number;
      targetMemberId?: number;
      note?: string;
    } = { kind: transactionForm.kind, amount, actorType: transactionForm.actorType };

    if (transactionForm.actorType === 'member') {
      payload.actorMemberId = Number(transactionForm.actorMemberId);
      if (!Number.isInteger(payload.actorMemberId) || (payload.actorMemberId ?? 0) <= 0) {
        setTransactionError('実行者を選択してください。');
        return;
      }
    }

    if (transactionForm.kind === 'grant') {
      if (!transactionForm.targetMemberId) {
        setTransactionError('配布先を選択してください。');
        return;
      }

      payload.targetMemberId = Number(transactionForm.targetMemberId);
      if (transactionForm.sourceMemberId) {
        payload.sourceMemberId = Number(transactionForm.sourceMemberId);
      }
    }

    if (transactionForm.kind === 'transfer') {
      if (!transactionForm.sourceMemberId || !transactionForm.targetMemberId) {
        setTransactionError('譲渡元と譲渡先を選択してください。');
        return;
      }

      payload.sourceMemberId = Number(transactionForm.sourceMemberId);
      payload.targetMemberId = Number(transactionForm.targetMemberId);
    }

    if (transactionForm.kind === 'consume') {
      if (!transactionForm.sourceMemberId) {
        setTransactionError('使用元を選択してください。');
        return;
      }

      payload.sourceMemberId = Number(transactionForm.sourceMemberId);
    }

    if (transactionForm.note.trim()) {
      payload.note = transactionForm.note.trim();
    }

    setSubmittingTransaction(true);
    setTransactionError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/spaces/${selectedSpaceId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? '取引の作成に失敗しました。');
      }

      await Promise.all([loadSpaces(), loadMembers(selectedSpaceId), loadTransactions(selectedSpaceId)]);
      setTransactionForm((current) => ({
        ...current,
        amount: current.kind === 'consume' ? current.amount : '100',
        note: ''
      }));
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : '取引の作成に失敗しました。');
    } finally {
      setSubmittingTransaction(false);
    }
  }

  function formatTransactionLabel(item: SpaceTransaction) {
    if (item.kind === 'grant') {
      return item.sourceDisplayName
        ? `${item.sourceDisplayName} から ${item.targetDisplayName ?? 'unknown'} に配布`
        : `${item.targetDisplayName ?? 'unknown'} に新規発行`;
    }

    if (item.kind === 'transfer') {
      return `${item.sourceDisplayName ?? 'unknown'} から ${item.targetDisplayName ?? 'unknown'} に譲渡`;
    }

    return `${item.sourceDisplayName ?? 'unknown'} が使用`;
  }

  function formatActorLabel(item: SpaceTransaction) {
    if (item.actorType === 'member') {
      return item.actorDisplayName ? `実行者: ${item.actorDisplayName}` : '実行者: member';
    }

    return `実行者: ${item.actorType}`;
  }

  return (
    <main className="app-shell">
      <Topbar
        canOpenRoom={selectedSpaceId != null}
        onOpenHome={() => setScreen('home')}
        onOpenMenu={() => setScreen('menu')}
        onOpenRoom={() => {
          if (selectedSpaceId) {
            void openRoom(selectedSpaceId);
          }
        }}
      />

      {screen === 'home' ? <HomeScreen onOpenMenu={() => setScreen('menu')} /> : null}
      {screen === 'menu' ? (
        <MenuScreen
          loadingSpaces={loadingSpaces}
          spacesError={spacesError}
          recentSpaces={recentSpaces}
          onOpenCreate={() => setScreen('create')}
          onOpenJoin={() => setScreen('join')}
          onOpenRoom={(spaceId) => void openRoom(spaceId)}
        />
      ) : null}
      {screen === 'create' ? (
        <CreateScreen
          createError={createError}
          spaceForm={spaceForm}
          submittingSpace={submittingSpace}
          onBack={() => setScreen('menu')}
          onSubmit={handleSpaceSubmit}
          onModeChange={handleModeChange}
          onFieldChange={updateSpaceForm}
        />
      ) : null}
      {screen === 'join' ? (
        <JoinScreen
          joinError={joinError}
          joinNotice={joinNotice}
          joinForm={joinForm}
          submittingJoin={submittingJoin}
          onBack={() => setScreen('menu')}
          onSubmit={handleJoinSubmit}
          onFieldChange={updateJoinForm}
          onApplyQrPayload={applyJoinCodeFromQrPayload}
        />
      ) : null}
      {screen === 'room' ? (
        <RoomScreen
          selectedSpace={selectedSpace}
          shareJoinLink={shareJoinLink}
          guestSessionMember={guestSessionMember}
          members={members}
          transactions={transactions}
          loadingMembers={loadingMembers}
          loadingTransactions={loadingTransactions}
          memberError={memberError}
          transactionError={transactionError}
          transactionForm={transactionForm}
          submittingTransaction={submittingTransaction}
          onBackToMenu={() => setScreen('menu')}
          onOpenJoin={() => setScreen('join')}
          onRefreshTransactions={() => {
            if (selectedSpace) {
              void loadTransactions(selectedSpace.id);
            }
          }}
          onTransactionFieldChange={updateTransactionForm}
          onSubmitTransaction={handleTransactionSubmit}
          formatTransactionLabel={formatTransactionLabel}
          formatActorLabel={formatActorLabel}
        />
      ) : null}
    </main>
  );
}
