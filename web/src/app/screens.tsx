import { FormEventHandler } from 'react';

import {
  InlineNotice,
  JoinForm,
  Space,
  SpaceForm,
  SpaceKind,
  SpaceMember,
  SpaceTransaction,
  SpaceVisibility,
  TransactionActorType,
  TransactionForm,
  TransactionKind,
  normalizeSpaceCode
} from './types';

type TopbarProps = {
  canOpenRoom: boolean;
  onOpenHome: () => void;
  onOpenMenu: () => void;
  onOpenRoom: () => void;
};

export function Topbar(props: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <span className="brand-mark">PM</span>
        <div>
          <strong>Point Manager</strong>
          <p>Home / Menu / Create / Join / Room</p>
        </div>
      </div>

      <div className="topbar-actions">
        <button type="button" className="nav-link" onClick={props.onOpenHome}>
          Home
        </button>
        <button type="button" className="nav-link" onClick={props.onOpenMenu}>
          Menu
        </button>
        <button type="button" className="nav-link" disabled={!props.canOpenRoom} onClick={props.onOpenRoom}>
          Room
        </button>
      </div>
    </header>
  );
}

export function HomeScreen({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <>
      <section className="hero-panel home-hero">
        <p className="eyebrow">Home</p>
        <h1>ポイント管理アプリの入口です。利用前に概要だけを確認できます。</h1>
        <p className="lead">
          この画面は説明と将来のログイン導線の置き場です。実際の作成や参加の分岐は次の Menu に集約します。
        </p>
        <div className="hero-actions">
          <button type="button" className="hero-primary" onClick={onOpenMenu}>
            メニューへ進む
          </button>
          <button type="button" className="hero-secondary" disabled>
            ログイン機能は準備中
          </button>
        </div>
      </section>

      <section className="content-grid home-grid">
        <article className="glass-card action-card">
          <h2>できること</h2>
          <ul className="feature-list">
            <li>スペース作成</li>
            <li>スペースコード参加</li>
            <li>QR 文字列からの参加コード抽出</li>
            <li>append-only 履歴確認</li>
          </ul>
        </article>
        <article className="glass-card note-card">
          <h2>今後追加するもの</h2>
          <ul className="note-list">
            <li>ログイン</li>
            <li>カメラ直接読み取り</li>
            <li>再入室トークン</li>
          </ul>
        </article>
      </section>
    </>
  );
}

type MenuScreenProps = {
  loadingSpaces: boolean;
  spacesError: string | null;
  recentSpaces: Space[];
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  onOpenRoom: (spaceId: number) => void;
};

export function MenuScreen(props: MenuScreenProps) {
  return (
    <>
      <section className="hero-panel menu-hero">
        <p className="eyebrow">Menu</p>
        <h1>ここで次の操作を選びます。</h1>
        <p className="lead">作成と参加の入力フォームは、この先の専用画面に分けています。</p>
        <div className="hero-actions">
          <button type="button" className="hero-primary" onClick={props.onOpenCreate}>
            スペースを作成する
          </button>
          <button type="button" className="hero-secondary" onClick={props.onOpenJoin}>
            スペースに参加する
          </button>
        </div>
      </section>

      <section className="content-grid menu-grid">
        <article className="glass-card action-card menu-choice-card">
          <h2>選べる操作</h2>
          <div className="choice-grid">
            <button type="button" className="menu-choice" onClick={props.onOpenCreate}>
              <span>CREATE</span>
              <strong>スペース作成</strong>
              <p>モードと設定を決めて、送信時に DB 登録します。</p>
            </button>
            <button type="button" className="menu-choice" onClick={props.onOpenJoin}>
              <span>JOIN</span>
              <strong>スペース参加</strong>
              <p>コード入力か QR 文字列から参加コードを取り込みます。</p>
            </button>
          </div>
        </article>

        <article className="glass-card recent-card">
          <div className="section-heading">
            <div>
              <h2>最近のスペース</h2>
              <p>既存スペースを Room 画面で開きます。</p>
            </div>
            <a href="http://localhost:3000/api-docs" target="_blank" rel="noreferrer">
              Swagger
            </a>
          </div>
          {props.loadingSpaces ? <p className="muted">読み込み中...</p> : null}
          {props.spacesError ? <p className="error-banner">{props.spacesError}</p> : null}
          <ul className="space-list compact-list">
            {props.recentSpaces.map((space) => (
              <li key={space.id}>
                <button type="button" className="space-card" onClick={() => props.onOpenRoom(space.id)}>
                  <div className="space-card-header">
                    <span className={`mode-pill mode-${space.kind}`}>{space.kind}</span>
                    <span className="code-pill">{space.code}</span>
                  </div>
                  <strong>{space.name}</strong>
                  <p>
                    {space.memberCount} members · {space.totalPoints.toLocaleString('ja-JP')} pts
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}

type CreateScreenProps = {
  createError: string | null;
  spaceForm: SpaceForm;
  submittingSpace: boolean;
  onBack: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onModeChange: (nextKind: SpaceKind) => void;
  onFieldChange: <K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) => void;
};

export function CreateScreen(props: CreateScreenProps) {
  return (
    <>
      <section className="hero-panel create-hero">
        <p className="eyebrow">Create Space</p>
        <h1>モードと部屋設定を決めて、作成時に DB へ登録します。</h1>
        <p className="lead">作成成功後はそのまま Room 画面へ遷移します。</p>
      </section>

      <section className="content-grid create-grid">
        <article className="glass-card accent-card create-card create-screen-card">
          <div className="section-heading">
            <div>
              <h2>スペース作成</h2>
              <p>送信時にスペースと初期データを登録します。</p>
            </div>
            <button type="button" className="secondary-button" onClick={props.onBack}>
              メニューへ戻る
            </button>
          </div>
          {props.createError ? <p className="error-banner">{props.createError}</p> : null}
          <form onSubmit={props.onSubmit} className="space-form">
            <label>
              スペース名
              <input
                value={props.spaceForm.name}
                onChange={(event) => props.onFieldChange('name', event.target.value)}
                placeholder="例: Spring Event Bank"
              />
            </label>
            <div className="inline-fields">
              <label>
                モード
                <select value={props.spaceForm.kind} onChange={(event) => props.onModeChange(event.target.value as SpaceKind)}>
                  <option value="owner">owner</option>
                  <option value="room">room</option>
                </select>
              </label>
              <label>
                公開範囲
                <select
                  value={props.spaceForm.visibility}
                  onChange={(event) => props.onFieldChange('visibility', event.target.value as SpaceVisibility)}
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
                  value={props.spaceForm.initialPoints}
                  onChange={(event) => props.onFieldChange('initialPoints', event.target.value)}
                />
              </label>
              <label>
                ホスト名
                <input
                  value={props.spaceForm.hostDisplayName}
                  onChange={(event) => props.onFieldChange('hostDisplayName', event.target.value)}
                  placeholder="例: 運営A"
                />
              </label>
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={props.spaceForm.allowGuestJoin}
                onChange={(event) => props.onFieldChange('allowGuestJoin', event.target.checked)}
              />
              ゲスト参加を許可する
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={props.spaceForm.bankCanMint}
                disabled={props.spaceForm.kind !== 'owner'}
                onChange={(event) => props.onFieldChange('bankCanMint', event.target.checked)}
              />
              BANK の追加発行を許可する
            </label>
            <button type="submit" disabled={props.submittingSpace}>
              {props.submittingSpace ? '作成中...' : 'スペースを作成する'}
            </button>
          </form>
        </article>

        <article className="glass-card info-card">
          <h2>モードの違い</h2>
          <ul className="feature-list">
            <li>owner: BANK 起点で配布しやすい構成</li>
            <li>room: 参加者中心で始めやすい構成</li>
            <li>公開範囲とゲスト参加可否を作成時に固定</li>
            <li>成功時は Room へ遷移</li>
          </ul>
        </article>
      </section>
    </>
  );
}

type JoinScreenProps = {
  joinError: string | null;
  joinNotice: InlineNotice | null;
  joinForm: JoinForm;
  submittingJoin: boolean;
  onBack: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onFieldChange: <K extends keyof JoinForm>(key: K, value: JoinForm[K]) => void;
  onApplyQrPayload: () => void;
};

export function JoinScreen(props: JoinScreenProps) {
  return (
    <>
      <section className="hero-panel join-hero">
        <p className="eyebrow">Join Space</p>
        <h1>スペースコードを入力するか、QR 文字列から取り込んで参加します。</h1>
        <p className="lead">
          QR 画像のカメラ読み取りまではまだ実装していませんが、QR が保持する共有リンクや文字列を貼り付ければ同じ参加導線に接続できます。
        </p>
      </section>

      <section className="content-grid join-grid">
        <article className="glass-card accent-card join-card">
          <div className="section-heading">
            <div>
              <h2>スペース参加</h2>
              <p>内部 ID ではなく、共有用のスペースコードを使います。</p>
            </div>
            <button type="button" className="secondary-button" onClick={props.onBack}>
              メニューへ戻る
            </button>
          </div>
          {props.joinError ? <p className="error-banner">{props.joinError}</p> : null}
          {props.joinNotice ? <p className={`status-banner status-${props.joinNotice.tone}`}>{props.joinNotice.message}</p> : null}
          <form onSubmit={props.onSubmit} className="space-form">
            <label>
              スペースコード
              <input
                value={props.joinForm.code}
                onChange={(event) => props.onFieldChange('code', normalizeSpaceCode(event.target.value))}
                placeholder="例: ROOM01"
              />
            </label>
            <label>
              表示名
              <input
                value={props.joinForm.displayName}
                onChange={(event) => props.onFieldChange('displayName', event.target.value)}
                placeholder="例: Guest Player"
              />
            </label>
            <div className="inline-fields action-row">
              <button type="submit" disabled={props.submittingJoin}>
                {props.submittingJoin ? '参加中...' : 'スペースに参加する'}
              </button>
              <button type="button" className="secondary-button qr-button" onClick={props.onApplyQrPayload}>
                QR 文字列を適用
              </button>
            </div>
          </form>
        </article>

        <article className="glass-card info-card qr-card">
          <h2>QR 参加</h2>
          <p className="muted">
            スマートフォンで読み取った結果や、QR に埋め込んだ共有リンクを貼り付けるとコード欄へ反映します。
          </p>
          <div className="space-form compact-form">
            <label>
              QR 文字列または共有リンク
              <textarea
                rows={6}
                value={props.joinForm.qrPayload}
                onChange={(event) => props.onFieldChange('qrPayload', event.target.value)}
                placeholder={['ROOM01', 'http://localhost:5173/?code=ROOM01', 'point-manager://join?code=ROOM01'].join('\n')}
              />
            </label>
            <button type="button" onClick={props.onApplyQrPayload}>
              コードを抽出する
            </button>
          </div>
          <ul className="feature-list qr-hint-list">
            <li>生のコード ROOM01 をそのまま貼れます</li>
            <li>共有リンク ?code=ROOM01 を解析できます</li>
            <li>抽出後は通常の参加 API をそのまま利用します</li>
          </ul>
        </article>
      </section>
    </>
  );
}

type RoomScreenProps = {
  selectedSpace: Space | null;
  shareJoinLink: string;
  guestSessionMember: SpaceMember | null;
  members: SpaceMember[];
  transactions: SpaceTransaction[];
  loadingMembers: boolean;
  loadingTransactions: boolean;
  memberError: string | null;
  transactionError: string | null;
  transactionForm: TransactionForm;
  submittingTransaction: boolean;
  onBackToMenu: () => void;
  onOpenJoin: () => void;
  onRefreshTransactions: () => void;
  onTransactionFieldChange: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void;
  onSubmitTransaction: FormEventHandler<HTMLFormElement>;
  formatTransactionLabel: (item: SpaceTransaction) => string;
  formatActorLabel: (item: SpaceTransaction) => string;
};

export function RoomScreen(props: RoomScreenProps) {
  return (
    <>
      <section className="hero-panel room-hero">
        <p className="eyebrow">Room</p>
        <h1>ポイント操作と履歴確認を行う部屋画面です。</h1>
        <p className="lead">メンバー状況、取引入力、append-only 履歴を 1 画面にまとめています。</p>
        <div className="hero-actions room-actions">
          <button type="button" className="hero-secondary" onClick={props.onBackToMenu}>
            メニューへ戻る
          </button>
          <button type="button" className="hero-secondary" onClick={props.onOpenJoin}>
            別のスペースに参加する
          </button>
        </div>
        {props.guestSessionMember ? (
          <div className="session-banner">
            <span>Current guest</span>
            <strong>{props.guestSessionMember.displayName}</strong>
            <p>ID {props.guestSessionMember.id} で参加中</p>
          </div>
        ) : null}
      </section>

      {props.selectedSpace ? (
        <section className="content-grid room-grid">
          <article className="glass-card detail-card room-summary-card">
            <div className="section-heading">
              <div>
                <h2>部屋情報</h2>
                <p>現在選択中のスペースです。</p>
              </div>
              <span className="code-pill">{props.selectedSpace.code}</span>
            </div>
            <div className="selected-summary">
              <div>
                <p className="muted-label">選択中</p>
                <strong>{props.selectedSpace.name}</strong>
                <p className="muted">
                  {props.selectedSpace.kind} · {props.selectedSpace.memberCount} members ·{' '}
                  {props.selectedSpace.totalPoints.toLocaleString('ja-JP')} pts
                </p>
              </div>
              <div className="summary-grid">
                <article>
                  <span>初期ポイント</span>
                  <strong>{props.selectedSpace.initialPoints.toLocaleString('ja-JP')}</strong>
                </article>
                <article>
                  <span>ランキング</span>
                  <strong>{props.selectedSpace.rankingMode}</strong>
                </article>
                <article>
                  <span>BANK</span>
                  <strong>{props.selectedSpace.bankCanMint ? '追加発行可' : 'なし'}</strong>
                </article>
              </div>
              <div className="share-panel">
                <span className="muted-label">共有リンク</span>
                <p className="share-value">{props.shareJoinLink}</p>
                <p className="muted">このリンクを QR 化すれば Join Space の QR 入力欄で読み取れます。</p>
              </div>
            </div>
            {props.loadingMembers ? <p className="muted">メンバーを取得中...</p> : null}
            {props.memberError ? <p className="error-banner">{props.memberError}</p> : null}
            <ul className="member-list">
              {props.members.map((member) => (
                <li key={member.id} className="member-row">
                  <div>
                    <span className={`role-pill role-${member.role}`}>{member.role}</span>
                    <strong>{member.displayName}</strong>
                    <p>
                      {member.isGuest ? 'guest' : 'registered'} · {member.canTransfer ? 'transfer on' : 'transfer off'}
                    </p>
                  </div>
                  <strong className="points-value">{member.points.toLocaleString('ja-JP')} pt</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="glass-card accent-card transaction-card room-operation-card">
            <h2>ポイント操作</h2>
            <p>配布、譲渡、使用を取引として追加します。</p>
            {props.transactionError ? <p className="error-banner">{props.transactionError}</p> : null}
            <form onSubmit={props.onSubmitTransaction} className="space-form">
              <div className="inline-fields">
                <label>
                  種別
                  <select
                    value={props.transactionForm.kind}
                    onChange={(event) => props.onTransactionFieldChange('kind', event.target.value as TransactionKind)}
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
                    value={props.transactionForm.amount}
                    onChange={(event) => props.onTransactionFieldChange('amount', event.target.value)}
                  />
                </label>
              </div>
              <label>
                実行種別
                <select
                  value={props.transactionForm.actorType}
                  onChange={(event) =>
                    props.onTransactionFieldChange('actorType', event.target.value as TransactionActorType)
                  }
                >
                  <option value="member">member</option>
                  <option value="system">system</option>
                  <option value="qr">qr</option>
                </select>
              </label>
              {props.transactionForm.actorType === 'member' ? (
                <label>
                  実行者
                  <select
                    value={props.transactionForm.actorMemberId}
                    onChange={(event) => props.onTransactionFieldChange('actorMemberId', event.target.value)}
                  >
                    <option value="">選択してください</option>
                    {props.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.displayName} ({member.role})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                {props.transactionForm.kind === 'consume' ? '使用元' : '操作元'}
                <select
                  value={props.transactionForm.sourceMemberId}
                  onChange={(event) => props.onTransactionFieldChange('sourceMemberId', event.target.value)}
                >
                  {props.transactionForm.kind === 'grant' && props.selectedSpace.kind === 'owner' && props.selectedSpace.bankCanMint ? (
                    <option value="">新規発行</option>
                  ) : null}
                  <option value="">選択してください</option>
                  {props.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName} ({member.points} pt)
                    </option>
                  ))}
                </select>
              </label>
              {props.transactionForm.kind === 'grant' || props.transactionForm.kind === 'transfer' ? (
                <label>
                  {props.transactionForm.kind === 'grant' ? '配布先' : '譲渡先'}
                  <select
                    value={props.transactionForm.targetMemberId}
                    onChange={(event) => props.onTransactionFieldChange('targetMemberId', event.target.value)}
                  >
                    <option value="">選択してください</option>
                    {props.members.map((member) => (
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
                  value={props.transactionForm.note}
                  onChange={(event) => props.onTransactionFieldChange('note', event.target.value)}
                  placeholder="例: Round 1 reward"
                />
              </label>
              <button type="submit" disabled={props.submittingTransaction}>
                {props.submittingTransaction ? '登録中...' : '取引を記録する'}
              </button>
            </form>
          </article>

          <article className="glass-card history-card room-history-card">
            <div className="section-heading">
              <div>
                <h2>履歴</h2>
                <p>最新の取引を上から表示します。</p>
              </div>
              <button type="button" className="secondary-button" disabled={props.loadingTransactions} onClick={props.onRefreshTransactions}>
                {props.loadingTransactions ? '更新中...' : '更新'}
              </button>
            </div>
            {props.loadingTransactions ? <p className="muted">履歴を取得中...</p> : null}
            <ul className="transaction-list">
              {props.transactions.map((item) => (
                <li key={item.id} className="transaction-row">
                  <div>
                    <span className={`transaction-pill transaction-${item.kind}`}>{item.kind}</span>
                    <strong>{props.formatTransactionLabel(item)}</strong>
                    <p>{new Date(item.createdAt).toLocaleString('ja-JP')}</p>
                    <p>{props.formatActorLabel(item)}</p>
                    {item.note ? <p className="transaction-note">{item.note}</p> : null}
                  </div>
                  <strong className="points-value">{item.amount.toLocaleString('ja-JP')} pt</strong>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : (
        <section className="content-grid room-grid">
          <article className="glass-card detail-card">
            <h2>部屋が選択されていません</h2>
            <p className="muted">メニュー画面から既存スペースを開くか、新しく作成してください。</p>
          </article>
        </section>
      )}
    </>
  );
}
