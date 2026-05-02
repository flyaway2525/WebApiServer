import { CreateScreenProps } from '../createScreenProps';
import { createRandomHostDisplayName, createRandomSpaceName } from '../naming';
import { SpaceKind, SpaceVisibility, rolePresetOptions } from '../types';

export function CreateScreen(props: CreateScreenProps) {
  const { state, actions } = props;

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
            <button type="button" className="secondary-button" onClick={actions.onBack}>
              メニューへ戻る
            </button>
          </div>
          {state.createError ? <p className="error-banner">{state.createError}</p> : null}
          <form onSubmit={actions.onSubmit} className="space-form">
            <div className="inline-fields action-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  actions.onFieldChange('name', createRandomSpaceName());
                  actions.onFieldChange('hostDisplayName', createRandomHostDisplayName());
                }}
              >
                テスト名を再生成
              </button>
            </div>
            <label>
              スペース名
              <input
                value={state.spaceForm.name}
                onChange={(event) => actions.onFieldChange('name', event.target.value)}
                placeholder="例: Spring Event Bank"
              />
            </label>
            <div className="inline-fields">
              <label>
                モード
                <select value={state.spaceForm.kind} onChange={(event) => actions.onModeChange(event.target.value as SpaceKind)}>
                  <option value="owner">owner</option>
                  <option value="room">room</option>
                </select>
              </label>
              <label>
                ロールプリセット
                <select
                  value={state.spaceForm.rolePreset}
                  onChange={(event) => actions.onFieldChange('rolePreset', event.target.value as typeof state.spaceForm.rolePreset)}
                >
                  {rolePresetOptions.filter((option) => option.kind === state.spaceForm.kind).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                公開範囲
                <select
                  value={state.spaceForm.visibility}
                  onChange={(event) => actions.onFieldChange('visibility', event.target.value as SpaceVisibility)}
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
                  value={state.spaceForm.initialPoints}
                  onChange={(event) => actions.onFieldChange('initialPoints', event.target.value)}
                />
              </label>
              <label>
                ホスト名
                <input
                  value={state.spaceForm.hostDisplayName}
                  onChange={(event) => actions.onFieldChange('hostDisplayName', event.target.value)}
                  placeholder="例: 運営A"
                />
              </label>
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={state.spaceForm.allowGuestJoin}
                onChange={(event) => actions.onFieldChange('allowGuestJoin', event.target.checked)}
              />
              ゲスト参加を許可する
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={state.spaceForm.bankCanMint}
                disabled={state.spaceForm.kind !== 'owner'}
                onChange={(event) => actions.onFieldChange('bankCanMint', event.target.checked)}
              />
              BANK の追加発行を許可する
            </label>
            <button type="submit" disabled={state.submittingSpace}>
              {state.submittingSpace ? '作成中...' : 'スペースを作成する'}
            </button>
          </form>
        </article>

        <article className="glass-card info-card">
          <h2>モードの違い</h2>
          <ul className="feature-list">
            <li>owner: BANK 起点で配布しやすい構成</li>
            <li>room: 参加者中心で始めやすい構成</li>
            <li>ロールプリセットで player や spectator を切り替え</li>
            <li>公開範囲とゲスト参加可否を作成時に固定</li>
            <li>成功時は Room へ遷移</li>
          </ul>
        </article>
      </section>
    </>
  );
}