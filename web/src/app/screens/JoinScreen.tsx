import { JoinScreenProps } from '../joinScreenProps';
import { normalizeSpaceCode } from '../types';

export function JoinScreen(props: JoinScreenProps) {
  const { state, actions } = props;

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
            <button type="button" className="secondary-button" onClick={actions.onBack}>
              メニューへ戻る
            </button>
          </div>
          {state.joinError ? <p className="error-banner">{state.joinError}</p> : null}
          {state.joinNotice ? <p className={`status-banner status-${state.joinNotice.tone}`}>{state.joinNotice.message}</p> : null}
          <form onSubmit={actions.onSubmit} className="space-form">
            <label>
              スペースコード
              <input
                value={state.joinForm.code}
                onChange={(event) => actions.onFieldChange('code', normalizeSpaceCode(event.target.value))}
                placeholder="例: ROOM01"
              />
            </label>
            <label>
              表示名
              <input
                value={state.joinForm.displayName}
                onChange={(event) => actions.onFieldChange('displayName', event.target.value)}
                placeholder="例: Guest Player"
              />
            </label>
            <div className="inline-fields action-row">
              <button type="submit" disabled={state.submittingJoin}>
                {state.submittingJoin ? '参加中...' : 'スペースに参加する'}
              </button>
              <button type="button" className="secondary-button qr-button" onClick={actions.onApplyQrPayload}>
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
                value={state.joinForm.qrPayload}
                onChange={(event) => actions.onFieldChange('qrPayload', event.target.value)}
                placeholder={['ROOM01', 'http://localhost:5173/?code=ROOM01', 'point-manager://join?code=ROOM01'].join('\n')}
              />
            </label>
            <button type="button" onClick={actions.onApplyQrPayload}>
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