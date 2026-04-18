import { FormEvent, useEffect, useState } from 'react';

type SpaceKind = 'owner' | 'room';
type SpaceVisibility = 'private' | 'members' | 'public';

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

type SpaceForm = {
  name: string;
  kind: SpaceKind;
  visibility: SpaceVisibility;
  initialPoints: string;
  allowGuestJoin: boolean;
  bankCanMint: boolean;
  hostDisplayName: string;
};

const apiBaseUrl = 'http://localhost:3000';

const initialForm: SpaceForm = {
  name: '',
  kind: 'owner',
  visibility: 'members',
  initialPoints: '10000',
  allowGuestJoin: true,
  bankCanMint: true,
  hostDisplayName: ''
};

export default function App() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [form, setForm] = useState<SpaceForm>(initialForm);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadSpaces();
  }, []);

  useEffect(() => {
    if (!selectedSpaceId) {
      setMembers([]);
      return;
    }

    void loadMembers(selectedSpaceId);
  }, [selectedSpaceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('スペース名を入力してください。');
      return;
    }

    if (!form.hostDisplayName.trim()) {
      setError('ホスト名を入力してください。');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          kind: form.kind,
          visibility: form.visibility,
          initialPoints: Number(form.initialPoints),
          allowGuestJoin: form.allowGuestJoin,
          bankCanMint: form.kind === 'owner' ? form.bankCanMint : false,
          hostDisplayName: form.hostDisplayName
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? 'スペースの作成に失敗しました。');
      }

      const created = (await response.json()) as Space;
      setForm({
        ...initialForm,
        kind: created.kind,
        visibility: created.kind === 'owner' ? 'members' : 'private',
        initialPoints: String(created.initialPoints),
        bankCanMint: created.kind === 'owner'
      });
      await loadSpaces();
      setSelectedSpaceId(created.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'スペースの作成に失敗しました。'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSpace = spaces.find((item) => item.id === selectedSpaceId) ?? null;

  function updateForm<K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Point Space Prototype</p>
        <h1>ゲスト参加を前提にしたポイント管理アプリの最初の縦切りです。</h1>
        <p className="lead">
          オーナー型とルーム型を同じスペース概念で扱い、作成・閲覧・初期メンバー確認までを
          今の API と UI に載せ替えました。次は QR 参加、取引履歴、ゲスト再入室に広げます。
        </p>
        <div className="hero-metrics">
          <article>
            <span>Modes</span>
            <strong>2</strong>
            <p>owner / room</p>
          </article>
          <article>
            <span>Ranking</span>
            <strong>manual</strong>
            <p>initial MVP</p>
          </article>
          <article>
            <span>Guest flow</span>
            <strong>planned</strong>
            <p>QR join + claim</p>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <article className="glass-card list-card">
          <div className="section-heading">
            <div>
              <h2>スペース一覧</h2>
              <p>現在のスペースは API とローカル DB から取得しています。</p>
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
                  onClick={() => setSelectedSpaceId(item.id)}
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
            <p className="muted">スペースがまだありません。右のフォームから作成してください。</p>
          )}
        </article>

        <article className="glass-card accent-card create-card">
          <h2>スペース作成</h2>
          <p>オーナー型とルーム型のどちらでも開始できます。今は作成時点の基本設定のみです。</p>
          <form onSubmit={handleSubmit} className="space-form">
            <label htmlFor="name">
              スペース名
              <input
                id="name"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="例: Spring Event Bank"
              />
            </label>

            <div className="inline-fields">
              <label>
                モード
                <select
                  value={form.kind}
                  onChange={(event) => {
                    const nextKind = event.target.value as SpaceKind;
                    updateForm('kind', nextKind);
                    updateForm('visibility', nextKind === 'owner' ? 'members' : 'private');
                    updateForm('bankCanMint', nextKind === 'owner');
                    updateForm('initialPoints', nextKind === 'owner' ? '10000' : '8000');
                  }}
                >
                  <option value="owner">owner</option>
                  <option value="room">room</option>
                </select>
              </label>

              <label>
                公開範囲
                <select
                  value={form.visibility}
                  onChange={(event) => updateForm('visibility', event.target.value as SpaceVisibility)}
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
                  value={form.initialPoints}
                  onChange={(event) => updateForm('initialPoints', event.target.value)}
                />
              </label>

              <label>
                ホスト名
                <input
                  value={form.hostDisplayName}
                  onChange={(event) => updateForm('hostDisplayName', event.target.value)}
                  placeholder="例: 運営A"
                />
              </label>
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.allowGuestJoin}
                onChange={(event) => updateForm('allowGuestJoin', event.target.checked)}
              />
              ゲスト参加を許可する
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.bankCanMint}
                disabled={form.kind !== 'owner'}
                onChange={(event) => updateForm('bankCanMint', event.target.checked)}
              />
              BANK の追加発行を許可する
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? '作成中...' : 'スペースを作成する'}
            </button>
          </form>
        </article>

        <article className="glass-card note-card">
          <h2>次の実装候補</h2>
          <ul className="note-list">
            <li>QR 参加と QR ポイント受取を同一基盤で扱う</li>
            <li>取引履歴を append-only で保存する</li>
            <li>ゲスト再入室用の匿名トークンを追加する</li>
            <li>手動ランキング更新をスナップショット化する</li>
          </ul>
        </article>
      </section>
    </main>
  );
}