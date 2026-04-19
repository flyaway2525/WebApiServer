import { RoomHistoryList } from './RoomHistoryList';
import { RoomOperationForm } from './RoomOperationForm';
import { RoomPendingRequestList } from './RoomPendingRequestList';
import { RoomScreenProps } from '../roomScreenProps';
import { RoomSummaryCard } from './RoomSummaryCard';

export function RoomScreen(props: RoomScreenProps) {
  const { state, actions, formatters } = props;

  return (
    <>
      <section className="hero-panel room-hero">
        <p className="eyebrow">Room</p>
        <h1>ポイント操作と履歴確認を行う部屋画面です。</h1>
        <p className="lead">メンバー状況、取引入力、append-only 履歴を 1 画面にまとめています。</p>
        <div className="hero-actions room-actions">
          <button type="button" className="hero-secondary" onClick={actions.onBackToMenu}>
            メニューへ戻る
          </button>
          <button type="button" className="hero-secondary" onClick={actions.onOpenJoin}>
            別のスペースに参加する
          </button>
        </div>
        {state.guestSessionMember ? (
          <div className="session-banner">
            <span>Current session</span>
            <strong>{state.guestSessionMember.displayName}</strong>
            <p>ID {state.guestSessionMember.id} として操作中</p>
          </div>
        ) : null}
      </section>

      {state.selectedSpace ? (
        <section className="content-grid room-grid">
          <RoomSummaryCard
            selectedSpace={state.selectedSpace}
            shareJoinLink={state.shareJoinLink}
            members={state.members}
            loadingMembers={state.loadingMembers}
            memberError={state.memberError}
          />

          <RoomOperationForm
            selectedSpace={state.selectedSpace}
            currentSessionMember={state.guestSessionMember}
            members={state.members}
            transactionError={state.transactionError}
            transactionForm={state.transactionForm}
            submittingTransaction={state.submittingTransaction}
            onTransactionFieldChange={actions.onTransactionFieldChange}
            onSubmitTransaction={actions.onSubmitTransaction}
          />

          <RoomHistoryList
            transactions={state.transactions}
            loadingTransactions={state.loadingTransactions}
            onRefreshTransactions={actions.onRefreshTransactions}
            formatTransactionLabel={formatters.formatTransactionLabel}
            formatActorLabel={formatters.formatActorLabel}
          />

          <RoomPendingRequestList
            requests={state.transactionRequests}
            loadingRequests={state.loadingTransactionRequests}
            requestError={state.transactionRequestError}
            resolvingRequestId={state.resolvingTransactionRequestId}
            onRefreshRequests={actions.onRefreshTransactions}
            onApproveRequest={actions.onApproveTransactionRequest}
            onRejectRequest={actions.onRejectTransactionRequest}
            canResolveRequest={formatters.canResolveTransactionRequest}
            formatRequestLabel={formatters.formatTransactionRequestLabel}
            formatRequestStatus={formatters.formatTransactionRequestStatus}
          />
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