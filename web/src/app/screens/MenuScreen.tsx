import { MenuScreenProps } from '../menuScreenProps';

export function MenuScreen(props: MenuScreenProps) {
  const { state, actions } = props;

  return (
    <>
      <section className="hero-panel menu-hero">
        <p className="eyebrow">Menu</p>
        <h1>ここで次の操作を選びます。</h1>
        <p className="lead">作成と参加の入力フォームは、この先の専用画面に分けています。</p>
        <div className="hero-actions">
          <button type="button" className="hero-primary" onClick={actions.onOpenCreate}>
            スペースを作成する
          </button>
          <button type="button" className="hero-secondary" onClick={actions.onOpenJoin}>
            スペースに参加する
          </button>
        </div>
      </section>

      <section className="content-grid menu-grid">
        <article className="glass-card action-card menu-choice-card">
          <h2>選べる操作</h2>
          <div className="choice-grid">
            <button type="button" className="menu-choice" onClick={actions.onOpenCreate}>
              <span>CREATE</span>
              <strong>スペース作成</strong>
              <p>モードと設定を決めて、送信時に DB 登録します。</p>
            </button>
            <button type="button" className="menu-choice" onClick={actions.onOpenJoin}>
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
          {state.loadingSpaces ? <p className="muted">読み込み中...</p> : null}
          {state.spacesError ? <p className="error-banner">{state.spacesError}</p> : null}
          <ul className="space-list compact-list">
            {state.recentSpaces.map((space) => (
              <li key={space.id}>
                <button type="button" className="space-card" onClick={() => actions.onOpenRoom(space.id)}>
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