import { Space, SpaceMember } from '../types';
import { RoomJoinQrCard } from './RoomJoinQrCard';

type RoomSummaryCardProps = {
  selectedSpace: Space;
  shareJoinLink: string;
  members: SpaceMember[];
  loadingMembers: boolean;
  memberError: string | null;
};

export function RoomSummaryCard(props: RoomSummaryCardProps) {
  return (
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
          <p className="muted">このリンクは QR コードとしても表示され、Join Space の既存導線にそのまま接続されます。</p>
        </div>
        <RoomJoinQrCard
          shareJoinLink={props.shareJoinLink}
          spaceCode={props.selectedSpace.code}
          spaceName={props.selectedSpace.name}
        />
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
  );
}