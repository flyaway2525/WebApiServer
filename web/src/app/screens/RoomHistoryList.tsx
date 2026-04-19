import { SpaceTransaction } from '../types';

type RoomHistoryListProps = {
  transactions: SpaceTransaction[];
  loadingTransactions: boolean;
  onRefreshTransactions: () => void;
  formatTransactionLabel: (item: SpaceTransaction) => string;
  formatActorLabel: (item: SpaceTransaction) => string;
};

export function RoomHistoryList(props: RoomHistoryListProps) {
  return (
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
  );
}