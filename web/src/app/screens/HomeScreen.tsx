import { HomeScreenProps } from '../homeScreenProps';

export function HomeScreen(props: HomeScreenProps) {
  const { actions } = props;

  return (
    <>
      <section className="hero-panel home-hero">
        <p className="eyebrow">Home</p>
        <h1>ポイント管理アプリの入口です。利用前に概要だけを確認できます。</h1>
        <p className="lead">
          この画面は説明と将来のログイン導線の置き場です。実際の作成や参加の分岐は次の Menu に集約します。
        </p>
        <div className="hero-actions">
          <button type="button" className="hero-primary" onClick={actions.onOpenMenu}>
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