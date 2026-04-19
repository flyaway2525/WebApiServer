import { useEffect, useMemo, useState } from 'react';

import { SpaceTransactionRequest } from '../types';

type RequestTab = 'pending' | 'history';
type HistoryStatusFilter = 'all' | 'approved' | 'rejected';
type HistorySortOrder = 'resolved-desc' | 'created-desc';
type RequestConfirmationState = {
  requestId: number;
  action: 'approve' | 'reject';
  rejectionReason: string;
};

function readRequestTabFromUrl(): RequestTab {
  if (typeof window === 'undefined') {
    return 'pending';
  }

  const query = new URLSearchParams(window.location.search);
  return query.get('requestTab') === 'history' ? 'history' : 'pending';
}

function readHistoryStatusFilterFromUrl(): HistoryStatusFilter {
  if (typeof window === 'undefined') {
    return 'all';
  }

  const query = new URLSearchParams(window.location.search);
  const value = query.get('requestStatus');
  return value === 'approved' || value === 'rejected' ? value : 'all';
}

function readHistorySortOrderFromUrl(): HistorySortOrder {
  if (typeof window === 'undefined') {
    return 'resolved-desc';
  }

  const query = new URLSearchParams(window.location.search);
  return query.get('requestSort') === 'created-desc' ? 'created-desc' : 'resolved-desc';
}

function syncRequestHistoryQuery(params: {
  activeTab: RequestTab;
  historyStatusFilter: HistoryStatusFilter;
  historySortOrder: HistorySortOrder;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  const query = new URLSearchParams(window.location.search);

  if (params.activeTab === 'history') {
    query.set('requestTab', 'history');
    if (params.historyStatusFilter === 'all') {
      query.delete('requestStatus');
    } else {
      query.set('requestStatus', params.historyStatusFilter);
    }

    if (params.historySortOrder === 'resolved-desc') {
      query.delete('requestSort');
    } else {
      query.set('requestSort', params.historySortOrder);
    }
  } else {
    query.delete('requestTab');
    query.delete('requestStatus');
    query.delete('requestSort');
  }

  const nextQuery = query.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

type RoomPendingRequestListProps = {
  requests: SpaceTransactionRequest[];
  loadingRequests: boolean;
  requestError: string | null;
  resolvingRequestId: number | null;
  onRefreshRequests: () => void;
  onApproveRequest: (requestId: number) => Promise<void>;
  onRejectRequest: (requestId: number, rejectionReason?: string) => Promise<void>;
  canResolveRequest: (item: SpaceTransactionRequest) => boolean;
  formatRequestLabel: (item: SpaceTransactionRequest) => string;
  formatRequestStatus: (item: SpaceTransactionRequest) => string;
};

export function RoomPendingRequestList(props: RoomPendingRequestListProps) {
  const [activeTab, setActiveTab] = useState<RequestTab>(readRequestTabFromUrl);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>(readHistoryStatusFilterFromUrl);
  const [historySortOrder, setHistorySortOrder] = useState<HistorySortOrder>(readHistorySortOrderFromUrl);
  const [confirmationState, setConfirmationState] = useState<RequestConfirmationState | null>(null);
  const pendingItems = useMemo(
    () => props.requests.filter((item) => item.status === 'pending'),
    [props.requests]
  );
  const historyItems = useMemo(
    () => props.requests.filter((item) => item.status !== 'pending'),
    [props.requests]
  );
  const approvedCount = useMemo(
    () => historyItems.filter((item) => item.status === 'approved').length,
    [historyItems]
  );
  const rejectedCount = useMemo(
    () => historyItems.filter((item) => item.status === 'rejected').length,
    [historyItems]
  );
  const filteredHistoryItems = useMemo(() => {
    if (historyStatusFilter === 'all') {
      return historyItems;
    }

    return historyItems.filter((item) => item.status === historyStatusFilter);
  }, [historyItems, historyStatusFilter]);
  const sortedHistoryItems = useMemo(() => {
    const items = [...filteredHistoryItems];

    items.sort((left, right) => {
      if (historySortOrder === 'created-desc') {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      const rightResolvedAt = right.resolvedAt ? new Date(right.resolvedAt).getTime() : 0;
      const leftResolvedAt = left.resolvedAt ? new Date(left.resolvedAt).getTime() : 0;

      return rightResolvedAt - leftResolvedAt;
    });

    return items;
  }, [filteredHistoryItems, historySortOrder]);
  const visibleItems = activeTab === 'pending' ? pendingItems : sortedHistoryItems;
  const emptyMessage =
    activeTab === 'pending'
      ? '現在、承認待ちの取引はありません。'
      : historyStatusFilter === 'all'
        ? 'まだ承認済み・却下済みの申請はありません。'
        : historyStatusFilter === 'approved'
          ? 'まだ承認済みの申請はありません。'
          : 'まだ却下済みの申請はありません。';

  function openConfirmation(requestId: number, action: 'approve' | 'reject') {
    setConfirmationState({ requestId, action, rejectionReason: '' });
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    syncRequestHistoryQuery({ activeTab, historyStatusFilter, historySortOrder });
  }, [activeTab, historyStatusFilter, historySortOrder]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    function handlePopState() {
      setActiveTab(readRequestTabFromUrl());
      setHistoryStatusFilter(readHistoryStatusFilterFromUrl());
      setHistorySortOrder(readHistorySortOrderFromUrl());
      setConfirmationState(null);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  async function confirmAction(requestId: number, action: 'approve' | 'reject') {
    if (action === 'approve') {
      await props.onApproveRequest(requestId);
    } else {
      const rejectionReason = confirmationState?.requestId === requestId
        ? confirmationState.rejectionReason.trim()
        : '';
      await props.onRejectRequest(requestId, rejectionReason || undefined);
    }

    setConfirmationState((current) => (current?.requestId === requestId ? null : current));
  }

  return (
    <article className="glass-card history-card room-request-card">
      <div className="section-heading">
        <div>
          <h2>申請一覧</h2>
          <p>承認待ちと、承認済み・却下済みの申請履歴を切り替えて確認できます。</p>
        </div>
        <button type="button" className="secondary-button" disabled={props.loadingRequests} onClick={props.onRefreshRequests}>
          {props.loadingRequests ? '更新中...' : '更新'}
        </button>
      </div>
      <div className="request-tab-row" role="tablist" aria-label="request status tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pending'}
          className={activeTab === 'pending' ? 'request-tab is-active' : 'request-tab'}
          onClick={() => {
            setActiveTab('pending');
            setConfirmationState(null);
          }}
        >
          承認待ち {pendingItems.length}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={activeTab === 'history' ? 'request-tab is-active' : 'request-tab'}
          onClick={() => {
            setActiveTab('history');
            setConfirmationState(null);
          }}
        >
          履歴 {historyItems.length}
        </button>
      </div>
      {activeTab === 'history' ? (
        <>
          <div className="request-filter-row" role="group" aria-label="history status filter">
            <button
              type="button"
              className={historyStatusFilter === 'all' ? 'request-filter is-active' : 'request-filter'}
              onClick={() => setHistoryStatusFilter('all')}
            >
              すべて {historyItems.length}
            </button>
            <button
              type="button"
              className={historyStatusFilter === 'approved' ? 'request-filter is-active' : 'request-filter'}
              onClick={() => setHistoryStatusFilter('approved')}
            >
              承認済み {approvedCount}
            </button>
            <button
              type="button"
              className={historyStatusFilter === 'rejected' ? 'request-filter is-active' : 'request-filter'}
              onClick={() => setHistoryStatusFilter('rejected')}
            >
              却下済み {rejectedCount}
            </button>
          </div>
          <div className="request-sort-row" role="group" aria-label="history sort order">
            <button
              type="button"
              className={historySortOrder === 'resolved-desc' ? 'request-filter is-active' : 'request-filter'}
              onClick={() => setHistorySortOrder('resolved-desc')}
            >
              新しい処理順
            </button>
            <button
              type="button"
              className={historySortOrder === 'created-desc' ? 'request-filter is-active' : 'request-filter'}
              onClick={() => setHistorySortOrder('created-desc')}
            >
              申請作成順
            </button>
          </div>
        </>
      ) : null}
      {props.requestError ? <p className="error-banner">{props.requestError}</p> : null}
      {props.loadingRequests ? <p className="muted">承認待ち取引を取得中...</p> : null}
      {!props.loadingRequests && visibleItems.length === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : null}
      <ul className="transaction-list request-list">
        {visibleItems.map((item) => {
          const canResolve = props.canResolveRequest(item);
          const isResolving = props.resolvingRequestId === item.id;
          const isConfirming = confirmationState?.requestId === item.id;
          const resolvedAtLabel = item.resolvedAt
            ? new Date(item.resolvedAt).toLocaleString('ja-JP')
            : null;

          return (
            <li key={item.id} className="transaction-row request-row">
              <div>
                <span className={`transaction-pill transaction-${item.kind}`}>{item.kind}</span>
                <strong>{props.formatRequestLabel(item)}</strong>
                <p>{new Date(item.createdAt).toLocaleString('ja-JP')}</p>
                <p>{props.formatRequestStatus(item)}</p>
                {item.requesterDisplayName ? <p>申請者: {item.requesterDisplayName}</p> : null}
                {item.status !== 'pending' && resolvedAtLabel ? <p>処理日時: {resolvedAtLabel}</p> : null}
                {item.status === 'approved' && item.approvedTransactionId ? <p>確定取引 ID: {item.approvedTransactionId}</p> : null}
                {item.status === 'rejected' && item.rejectionReason ? <p>却下理由: {item.rejectionReason}</p> : null}
                {item.note ? <p className="transaction-note">{item.note}</p> : null}
              </div>
              <div className="request-actions">
                <strong className="points-value">{item.amount.toLocaleString('ja-JP')} pt</strong>
                {activeTab === 'pending' && canResolve && isConfirming ? (
                  <div className="request-confirm-box">
                    <p>
                      {confirmationState.action === 'approve'
                        ? 'この申請を承認して取引を確定しますか。'
                        : 'この申請を却下しますか。'}
                    </p>
                    {confirmationState.action === 'reject' ? (
                      <label className="request-reason-field">
                        却下理由
                        <textarea
                          value={confirmationState.rejectionReason}
                          maxLength={240}
                          placeholder="任意: 却下理由を入力します。履歴タブに表示されます。"
                          onChange={(event) =>
                            setConfirmationState((current) =>
                              current?.requestId === item.id
                                ? { ...current, rejectionReason: event.target.value }
                                : current
                            )
                          }
                        />
                      </label>
                    ) : null}
                    <div className="request-action-row">
                      <button
                        type="button"
                        className={confirmationState.action === 'approve' ? 'secondary-button' : 'secondary-button danger-button'}
                        disabled={isResolving}
                        onClick={() => void confirmAction(item.id, confirmationState.action)}
                      >
                        {isResolving ? '処理中...' : confirmationState.action === 'approve' ? '承認を確定' : '却下を確定'}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={isResolving}
                        onClick={() => setConfirmationState(null)}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : activeTab === 'pending' && canResolve ? (
                  <div className="request-action-row">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isResolving}
                      onClick={() => openConfirmation(item.id, 'approve')}
                    >
                      承認
                    </button>
                    <button
                      type="button"
                      className="secondary-button danger-button"
                      disabled={isResolving}
                      onClick={() => openConfirmation(item.id, 'reject')}
                    >
                      却下
                    </button>
                  </div>
                ) : activeTab === 'pending' ? (
                  <p className="muted request-hint">この申請を処理する権限がありません。</p>
                ) : (
                  <p className="muted request-hint">この申請は処理済みです。</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}