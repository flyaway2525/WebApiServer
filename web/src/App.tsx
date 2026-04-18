import { FormEvent, useEffect, useState } from 'react';

type Screen = 'home' | 'join' | 'dashboard';
type SpaceKind = 'owner' | 'room';
type SpaceVisibility = 'private' | 'members' | 'public';
type TransactionKind = 'grant' | 'transfer' | 'consume';
type TransactionActorType = 'member' | 'system' | 'qr';

type Space = {
  id: number;
  code: string;
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: number;
  allowGuestJoin: boolean;
  rankingMode: 'manual' | 'polling';
  bankCanMint: boolean;
  createdAt: string;
  memberCount: number;
  totalPoints: number;
};

type SpaceMember = {
  id: number;
  spaceId: number;
  displayName: string;
  role: 'host' | 'bank' | 'member';
  isGuest: boolean;
  points: number;
  canTransfer: boolean;
  createdAt: string;
};

type SpaceTransaction = {
  id: number;
  spaceId: number;
  kind: TransactionKind;
  actorType: TransactionActorType;
  actorMemberId: number | null;
  actorDisplayName: string | null;
  sourceMemberId: number | null;
  sourceDisplayName: string | null;
  targetMemberId: number | null;
  targetDisplayName: string | null;
  amount: number;
  note: string | null;
  createdAt: string;
};

type SpaceForm = {
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: string;
  allowGuestJoin: boolean;
  bankCanMint: boolean;
  hostDisplayName: string;
};

type JoinForm = {
  code: string;
  displayName: string;
};

type TransactionForm = {
  kind: TransactionKind;
  actorType: TransactionActorType;
  actorMemberId: string;
  sourceMemberId: string;
  targetMemberId: string;
  amount: string;
  note: string;
};

type JoinResponse = {
  space: Space;
  member: SpaceMember;
};

const apiBaseUrl = 'http://localhost:3000';

const initialSpaceForm: SpaceForm = {
  name: '',
  kind: 'owner',
  visibility: 'members',
  initialPoints: '10000',
  allowGuestJoin: true,
  bankCanMint: true,
  hostDisplayName: ''
};

const initialJoinForm: JoinForm = {
  code: '',
  displayName: ''
};

const initialTransactionForm: TransactionForm = {
  kind: 'grant',
  actorType: 'member',
  actorMemberId: '',
  sourceMemberId: '',
  targetMemberId: '',
  amount: '100',
  note: ''
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [transactions, setTransactions] = useState<SpaceTransaction[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [guestSessionMember, setGuestSessionMember] = useState<SpaceMember | null>(null);
  const [spaceForm, setSpaceForm] = useState<SpaceForm>(initialSpaceForm);
  const [joinForm, setJoinForm] = useState<JoinForm>(initialJoinForm);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>(initialTransactionForm);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [submittingSpace, setSubmittingSpace] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [submittingTransaction, setSubmittingTransaction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const selectedSpace = spaces.find((item) => item.id === selectedSpaceId) ?? null;
  const recentSpaces = spaces.slice(0, 3);

  async function loadSpaces() {
    setLoadingSpaces(true);
    setError(null);

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
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'スペース一覧の取得に失敗しました。'
      );
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
    } catch (loadError) {
      setMemberError(
        loadError instanceof Error ? loadError.message : 'メンバー一覧の取得に失敗しました。'
      );
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
    } catch (loadError) {
      setTransactionError(
        loadError instanceof Error ? loadError.message : '取引履歴の取得に失敗しました。'
      );
    } finally {
      setLoadingTransactions(false);
    }
  }

  async function openDashboard(spaceId: number) {
    setSelectedSpaceId(spaceId);
    setScreen('dashboard');
    await Promise.all([loadMembers(spaceId), loadTransactions(spaceId)]);
  }

  useEffect(() => {
    void loadSpaces();
  }, []);

  useEffect(() => {
    if (!selectedSpaceId || screen !== 'dashboard') {
      return;
    }

    void loadMembers(selectedSpaceId);
    void loadTransactions(selectedSpaceId);
  }, [selectedSpaceId, screen]);

  useEffect(() => {
    if (!selectedSpace || members.length === 0) {
      return;
    }

    const bankMember = members.find((member) => member.role === 'bank') ?? null;
    const firstMember = members.find((member) => member.role !== 'bank') ?? members[0] ?? null;
    const defaultTarget = members.find((member) => member.role !== 'bank') ?? members[0] ?? null;

    setTransactionForm((current) => ({
      ...current,
      actorMemberId:
        current.actorType === 'member' &&
        current.actorMemberId &&
        members.some((member) => String(member.id) === current.actorMemberId)
          ? current.actorMemberId
          : String(firstMember?.id ?? bankMember?.id ?? ''),
      sourceMemberId:
        current.sourceMemberId && members.some((member) => String(member.id) === current.sourceMemberId)
          ? current.sourceMemberId
          : selectedSpace.kind === 'owner'
            ? String(bankMember?.id ?? '')
            : String(firstMember?.id ?? ''),
      targetMemberId:
        current.targetMemberId && members.some((member) => String(member.id) === current.targetMemberId)
          ? current.targetMemberId
          : String(defaultTarget?.id ?? '')
    }));
  }, [members, selectedSpace]);

  function updateSpaceForm<K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) {
    setSpaceForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateJoinForm<K extends keyof JoinForm>(key: K, value: JoinForm[K]) {
    setJoinForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateTransactionForm<K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) {
    setTransactionForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSpaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spaceForm.name.trim()) {
      setError('スペース名を入力してください。');
      return;
    }

    if (!spaceForm.hostDisplayName.trim()) {
      setError('ホスト名を入力してください。');
      return;
    }

    setSubmittingSpace(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
      await openDashboard(created.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'スペースの作成に失敗しました。'
      );
    } finally {
      setSubmittingSpace(false);
    }
  }

  async function handleJoinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!joinForm.code.trim()) {
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: joinForm.code,
          displayName: joinForm.displayName
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? 'スペースへの参加に失敗しました。');
      }

      const joined = (await response.json()) as JoinResponse;
      setGuestSessionMember(joined.member);
      setJoinForm(initialJoinForm);
      await loadSpaces();
      await openDashboard(joined.space.id);
    } catch (submitError) {
      setJoinError(
        submitError instanceof Error ? submitError.message : 'スペースへの参加に失敗しました。'
      );
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
    } = {
      kind: transactionForm.kind,
      amount,
      actorType: transactionForm.actorType
    };

    if (transactionForm.actorType === 'member') {
      payload.actorMemberId = Number(transactionForm.actorMemberId);
    }

    if (
      transactionForm.actorType === 'member' &&
      (!Number.isInteger(payload.actorMemberId) || (payload.actorMemberId ?? 0) <= 0)
    ) {
      setTransactionError('実行者を選択してください。');
      return;
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? '取引の作成に失敗しました。');
      }

      await loadSpaces();
      await loadMembers(selectedSpaceId);
      await loadTransactions(selectedSpaceId);
      setTransactionForm((current) => ({
        ...current,
        amount: current.kind === 'consume' ? current.amount : '100',
        note: ''
      }));
    } catch (submitError) {
      setTransactionError(
        submitError instanceof Error ? submitError.message : '取引の作成に失敗しました。'
      );
    } finally {
      setSubmittingTransaction(false);
    }
  }

  function formatTransactionLabel(item: SpaceTransaction) {
    if (item.kind === 'grant') {
      if (item.sourceDisplayName) {
        return `${item.sourceDisplayName} から ${item.targetDisplayName ?? 'unknown'} に配布`;
      }

      return `${item.targetDisplayName ?? 'unknown'} に新規発行`;
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
      <header className="topbar">
        <button type="button" className="nav-link" onClick={() => setScreen('home')}>
          Home
        </button>
        <button type="button" className="nav-link" onClick={() => setScreen('join')}>
          Guest Join
        </button>
        <button
          type="button"
          className="nav-link"
          onClick={() => setScreen('dashboard')}
          disabled={!selectedSpaceId}
        >
          Dashboard
        </button>
      </header>

      {screen === 'home' ? (
        <>
          <section className="hero-panel home-hero">
            <p className="eyebrow">Guest First Entry</p>
            <h1>ポイント管理アプリの入口を先に作り、参加導線を Web で検証できるようにしました。</h1>
            <p className="lead">
              まずはスペース作成、ゲスト参加、既存スペースの再オープンをトップから選べます。
              アカウント登録は後回しにし、利用開始までの摩擦を下げます。
            </p>
            <div className="hero-actions">
              <button type="button" className="hero-primary" onClick={() => setScreen('dashboard')}>
                スペースを作る
              </button>
              <button type="button" className="hero-secondary" onClick={() => setScreen('join')}>
                ゲストで参加する
              </button>
              <button type="button" className="hero-secondary" disabled>
                QR を読み込む
              </button>
            </div>
          </section>

          <section className="content-grid home-grid">
            <article className="glass-card action-card">
              <h2>今できること</h2>
              <ul className="feature-list">
                <li>オーナー型とルーム型のスペース作成</li>
                <li>スペースコードでのゲスト参加</li>
                <li>配布・譲渡・使用の記録</li>
                <li>append-only の履歴確認</li>
              </ul>
            </article>

            <article className="glass-card recent-card">
              <div className="section-heading">
                <div>
                  <h2>最近のスペース</h2>
                  <p>既存スペースをそのまま開けます。</p>
                </div>
                <a href="http://localhost:3000/api-docs" target="_blank" rel="noreferrer">
                  Swagger
                </a>
              </div>

              {loadingSpaces ? <p className="muted">読み込み中...</p> : null}
              {error ? <p className="error-banner">{error}</p> : null}

              <ul className="space-list compact-list">
                {recentSpaces.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="space-card" onClick={() => void openDashboard(item.id)}>
                      <div className="space-card-header">
                        <span className={`mode-pill mode-${item.kind}`}>{item.kind}</span>
                        <span className="code-pill">{item.code}</span>
                      </div>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.memberCount} members · {item.totalPoints.toLocaleString('ja-JP')} pts
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </article>

            <article className="glass-card accent-card note-card">
              <h2>次の導線</h2>
              <ul className="note-list">
                <li>QR 参加画面を追加する</li>
                <li>再入室トークンを guest join に繋ぐ</li>
                <li>ホームから最近の参加履歴を開けるようにする</li>
              </ul>
            </article>
          </section>
        </>
      ) : null}

      {screen === 'join' ? (
        <>
          <section className="hero-panel join-hero">
            <p className="eyebrow">Guest Join</p>
            <h1>スペースコードと表示名だけで、そのまま参加できます。</h1>
            <p className="lead">
              登録なしで参加でき、ルーム型なら初期ポイントが自動付与されます。オーナー型では残高 0 から開始します。
            </p>
          </section>

          <section className="content-grid join-grid">
            <article className="glass-card accent-card join-card">
              <h2>ゲスト参加</h2>
              <p>例: `ROOM01` または `BANK01` のようなスペースコードで参加します。</p>
              {joinError ? <p className="error-banner">{joinError}</p> : null}
              <form onSubmit={handleJoinSubmit} className="space-form">
                <label htmlFor="join-code">
                  スペースコード
                  <input
                    id="join-code"
                    value={joinForm.code}
                    onChange={(event) => updateJoinForm('code', event.target.value.toUpperCase())}
                    placeholder="例: ROOM01"
                  />
                </label>

                <label htmlFor="join-display-name">
                  表示名
                  <input
                    id="join-display-name"
                    value={joinForm.displayName}
                    onChange={(event) => updateJoinForm('displayName', event.target.value)}
                    placeholder="例: Guest Player"
                  />
                </label>

                <button type="submit" disabled={submittingJoin}>
                  {submittingJoin ? '参加中...' : 'ゲストで参加する'}
                </button>
              </form>
            </article>

            <article className="glass-card info-card">
              <h2>参加時の動き</h2>
              <ul className="feature-list">
                <li>表示名は重複可能です</li>
                <li>内部では別 ID が発行されます</li>
                <li>ルーム型では初期ポイントが配布されます</li>
                <li>取引履歴には guest join allocation が残ります</li>
              </ul>
            </article>
          </section>
        </>
      ) : null}

      {screen === 'dashboard' ? (
        <>
          <section className="hero-panel dashboard-hero">
            <p className="eyebrow">Space Dashboard</p>
            <h1>スペースの状態確認、ポイント操作、履歴確認をまとめて行う画面です。</h1>
            <p className="lead">
              ここから配布・譲渡・使用を記録できます。必要に応じてホームへ戻り、別スペースへの参加にも切り替えられます。
            </p>
            {guestSessionMember ? (
              <div className="session-banner">
                <span>Current guest</span>
                <strong>{guestSessionMember.displayName}</strong>
                <p>ID {guestSessionMember.id} で参加中</p>
              </div>
            ) : null}
          </section>

          <section className="content-grid">
            <article className="glass-card list-card">
              <div className="section-heading">
                <div>
                  <h2>スペース一覧</h2>
                  <p>残高合計は取引反映後の現在値です。</p>
                </div>
                <a href="http://localhost:3000/api-docs" target="_blank" rel="noreferrer">
                  Swagger
                </a>
              </div>

              {loadingSpaces ? <p className="muted">読み込み中...</p> : null}
              {error ? <p className="error-banner">{error}</p> : null}

              <ul className="space-list">
                {spaces.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`space-card ${selectedSpaceId === item.id ? 'space-card-active' : ''}`}
                      onClick={() => void openDashboard(item.id)}
                    >
                      <div className="space-card-header">
                        <span className={`mode-pill mode-${item.kind}`}>{item.kind}</span>
                        <span className="code-pill">{item.code}</span>
                      </div>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.memberCount} members · {item.totalPoints.toLocaleString('ja-JP')} pts
                        </p>
                      </div>
                      <dl className="space-meta">
                        <div>
                          <dt>公開範囲</dt>
                          <dd>{item.visibility}</dd>
                        </div>
                        <div>
                          <dt>ゲスト参加</dt>
                          <dd>{item.allowGuestJoin ? '許可' : '不可'}</dd>
                        </div>
                      </dl>
                    </button>
                  </li>
                ))}
              </ul>
            </article>

            <article className="glass-card detail-card">
              <h2>スペース詳細</h2>
              {selectedSpace ? (
                <>
                  <div className="selected-summary">
                    <div>
                      <p className="muted-label">選択中</p>
                      <strong>{selectedSpace.name}</strong>
                      <p className="muted">作成コード {selectedSpace.code}</p>
                    </div>
                    <div className="summary-grid">
                      <article>
                        <span>初期ポイント</span>
                        <strong>{selectedSpace.initialPoints.toLocaleString('ja-JP')}</strong>
                      </article>
                      <article>
                        <span>ランキング</span>
                        <strong>{selectedSpace.rankingMode}</strong>
                      </article>
                      <article>
                        <span>BANK</span>
                        <strong>{selectedSpace.bankCanMint ? '追加発行可' : 'なし'}</strong>
                      </article>
                    </div>
                  </div>

                  {loadingMembers ? <p className="muted">メンバーを取得中...</p> : null}
                  {memberError ? <p className="error-banner">{memberError}</p> : null}

                  <ul className="member-list">
                    {members.map((member) => (
                      <li key={member.id} className="member-row">
                        <div>
                          <span className={`role-pill role-${member.role}`}>{member.role}</span>
                          <strong>{member.displayName}</strong>
                          <p>
                            {member.isGuest ? 'guest' : 'registered'} ·{' '}
                            {member.canTransfer ? 'transfer on' : 'transfer off'}
                          </p>
                        </div>
                        <strong className="points-value">{member.points.toLocaleString('ja-JP')} pt</strong>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="muted">スペースがまだありません。下のフォームから作成してください。</p>
              )}
            </article>

            <article className="glass-card accent-card transaction-card">
              <h2>ポイント操作</h2>
              <p>配布・譲渡・使用を同じ台帳 API に積みます。履歴は取り消さず、次の取引で訂正します。</p>
              {transactionError ? <p className="error-banner">{transactionError}</p> : null}
              <form onSubmit={handleTransactionSubmit} className="space-form">
                <div className="inline-fields">
                  <label>
                    種別
                    <select
                      value={transactionForm.kind}
                      onChange={(event) =>
                        updateTransactionForm('kind', event.target.value as TransactionKind)
                      }
                    >
                      <option value="grant">grant</option>
                      <option value="transfer">transfer</option>
                      <option value="consume">consume</option>
                    </select>
                  </label>

                  <label>
                    金額
                    <input
                      type="number"
                      min="1"
                      value={transactionForm.amount}
                      onChange={(event) => updateTransactionForm('amount', event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  実行種別
                  <select
                    value={transactionForm.actorType}
                    onChange={(event) =>
                      updateTransactionForm('actorType', event.target.value as TransactionActorType)
                    }
                  >
                    <option value="member">member</option>
                    <option value="system">system</option>
                    <option value="qr">qr</option>
                  </select>
                </label>

                {transactionForm.actorType === 'member' ? (
                  <label>
                    実行者
                    <select
                      value={transactionForm.actorMemberId}
                      onChange={(event) => updateTransactionForm('actorMemberId', event.target.value)}
                    >
                      <option value="">選択してください</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName} ({member.role})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label>
                  {transactionForm.kind === 'consume' ? '使用元' : '操作元'}
                  <select
                    value={transactionForm.sourceMemberId}
                    onChange={(event) => updateTransactionForm('sourceMemberId', event.target.value)}
                  >
                    {transactionForm.kind === 'grant' && selectedSpace?.kind === 'owner' && selectedSpace.bankCanMint ? (
                      <option value="">新規発行</option>
                    ) : null}
                    <option value="">選択してください</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.displayName} ({member.points} pt)
                      </option>
                    ))}
                  </select>
                </label>

                {(transactionForm.kind === 'grant' || transactionForm.kind === 'transfer') ? (
                  <label>
                    {transactionForm.kind === 'grant' ? '配布先' : '譲渡先'}
                    <select
                      value={transactionForm.targetMemberId}
                      onChange={(event) => updateTransactionForm('targetMemberId', event.target.value)}
                    >
                      <option value="">選択してください</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName} ({member.points} pt)
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label>
                  メモ
                  <input
                    value={transactionForm.note}
                    onChange={(event) => updateTransactionForm('note', event.target.value)}
                    placeholder="例: Round 1 reward"
                  />
                </label>

                <button type="submit" disabled={submittingTransaction || !selectedSpace}>
                  {submittingTransaction ? '登録中...' : '取引を記録する'}
                </button>
              </form>
            </article>

            <article className="glass-card history-card">
              <div className="section-heading">
                <div>
                  <h2>取引履歴</h2>
                  <p>append-only の履歴です。新しい順に表示しています。</p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    if (selectedSpaceId) {
                      void loadTransactions(selectedSpaceId);
                    }
                  }}
                  disabled={!selectedSpaceId || loadingTransactions}
                >
                  {loadingTransactions ? '更新中...' : '更新'}
                </button>
              </div>

              {loadingTransactions ? <p className="muted">履歴を取得中...</p> : null}

              <ul className="transaction-list">
                {transactions.map((item) => (
                  <li key={item.id} className="transaction-row">
                    <div>
                      <span className={`transaction-pill transaction-${item.kind}`}>{item.kind}</span>
                      <strong>{formatTransactionLabel(item)}</strong>
                      <p>{new Date(item.createdAt).toLocaleString('ja-JP')}</p>
                      <p>{formatActorLabel(item)}</p>
                      {item.note ? <p className="transaction-note">{item.note}</p> : null}
                    </div>
                    <strong className="points-value">{item.amount.toLocaleString('ja-JP')} pt</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className="glass-card accent-card create-card">
              <h2>スペース作成</h2>
              <p>オーナー型とルーム型のどちらでも開始できます。初期ポイントは最初の台帳にも記録されます。</p>
              <form onSubmit={handleSpaceSubmit} className="space-form">
                <label htmlFor="name">
                  スペース名
                  <input
                    id="name"
                    value={spaceForm.name}
                    onChange={(event) => updateSpaceForm('name', event.target.value)}
                    placeholder="例: Spring Event Bank"
                  />
                </label>

                <div className="inline-fields">
                  <label>
                    モード
                    <select
                      value={spaceForm.kind}
                      onChange={(event) => {
                        const nextKind = event.target.value as SpaceKind;
                        updateSpaceForm('kind', nextKind);
                        updateSpaceForm('visibility', nextKind === 'owner' ? 'members' : 'private');
                        updateSpaceForm('bankCanMint', nextKind === 'owner');
                        updateSpaceForm('initialPoints', nextKind === 'owner' ? '10000' : '8000');
                      }}
                    >
                      <option value="owner">owner</option>
                      <option value="room">room</option>
                    </select>
                  </label>

                  <label>
                    公開範囲
                    <select
                      value={spaceForm.visibility}
                      onChange={(event) => updateSpaceForm('visibility', event.target.value as SpaceVisibility)}
                    >
                      <option value="private">private</option>
                      <option value="members">members</option>
                      <option value="public">public</option>
                    </select>
                  </label>
                </div>

                <div className="inline-fields">
                  <label>
                    初期ポイント
                    <input
                      type="number"
                      min="0"
                      value={spaceForm.initialPoints}
                      onChange={(event) => updateSpaceForm('initialPoints', event.target.value)}
                    />
                  </label>

                  <label>
                    ホスト名
                    <input
                      value={spaceForm.hostDisplayName}
                      onChange={(event) => updateSpaceForm('hostDisplayName', event.target.value)}
                      placeholder="例: 運営A"
                    />
                  </label>
                </div>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={spaceForm.allowGuestJoin}
                    onChange={(event) => updateSpaceForm('allowGuestJoin', event.target.checked)}
                  />
                  ゲスト参加を許可する
                </label>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={spaceForm.bankCanMint}
                    disabled={spaceForm.kind !== 'owner'}
                    onChange={(event) => updateSpaceForm('bankCanMint', event.target.checked)}
                  />
                  BANK の追加発行を許可する
                </label>

                <button type="submit" disabled={submittingSpace}>
                  {submittingSpace ? '作成中...' : 'スペースを作成する'}
                </button>
              </form>
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}