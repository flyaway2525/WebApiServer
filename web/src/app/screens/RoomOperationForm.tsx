import { FormEventHandler } from 'react';

import {
  Space,
  SpaceMember,
  TransactionActorType,
  TransactionForm,
  TransactionKind,
  TransactionSubmissionMode
} from '../types';

type RoomOperationFormProps = {
  selectedSpace: Space;
  currentSessionMember: SpaceMember | null;
  members: SpaceMember[];
  transactionError: string | null;
  transactionForm: TransactionForm;
  submittingTransaction: boolean;
  onTransactionFieldChange: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void;
  onSubmitTransaction: FormEventHandler<HTMLFormElement>;
};

export function RoomOperationForm(props: RoomOperationFormProps) {
  const isSpaceActive = props.selectedSpace.state === 'active';
  const isRequestMode = props.transactionForm.submissionMode === 'request';
  const hostMember = props.members.find((member) => member.role === 'host') ?? null;
  const requestRules = [
    `申請者は現在の session メンバー${props.currentSessionMember ? ` (${props.currentSessionMember.displayName})` : ''}として記録されます。`,
    hostMember
      ? `Host (${hostMember.displayName}) はすべての申請を承認または却下できます。`
      : 'Host はすべての申請を承認または却下できます。',
    '操作元に自分のメンバーを指定した申請は、そのメンバー本人も承認または却下できます。'
  ];

  if (props.currentSessionMember?.role !== 'host') {
    requestRules.push('自分の残高をそのまま使う操作は申請ではなく「即時記録」を使ってください。');
  }

  return (
    <article className="glass-card accent-card transaction-card room-operation-card">
      <h2>{isRequestMode ? '承認待ち取引を申請' : 'ポイント操作'}</h2>
      <p>
        {isRequestMode
          ? 'この内容は承認待ちとして送信され、申請一覧から承認または却下されます。'
          : '配布、譲渡、使用を即時取引として追加します。'}
      </p>
      {!isSpaceActive ? <p className="error-banner">このスペースは {props.selectedSpace.state} 状態のため、新しい取引は追加できません。</p> : null}
      {props.transactionError ? <p className="error-banner">{props.transactionError}</p> : null}
      <form onSubmit={props.onSubmitTransaction} className="space-form">
        <div className="mode-toggle" role="group" aria-label="transaction submission mode">
          <button
            type="button"
            className={props.transactionForm.submissionMode === 'direct' ? 'mode-toggle-button is-active' : 'mode-toggle-button'}
            disabled={!isSpaceActive}
            onClick={() => props.onTransactionFieldChange('submissionMode', 'direct' as TransactionSubmissionMode)}
          >
            即時記録
          </button>
          <button
            type="button"
            className={props.transactionForm.submissionMode === 'request' ? 'mode-toggle-button is-active' : 'mode-toggle-button'}
            disabled={!isSpaceActive}
            onClick={() => props.onTransactionFieldChange('submissionMode', 'request' as TransactionSubmissionMode)}
          >
            承認申請
          </button>
        </div>
        <div className="inline-fields">
          <label>
            種別
            <select
              disabled={!isSpaceActive}
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
              disabled={!isSpaceActive}
              type="number"
              min="1"
              value={props.transactionForm.amount}
              onChange={(event) => props.onTransactionFieldChange('amount', event.target.value)}
            />
          </label>
        </div>
        {!isRequestMode ? (
          <label>
            実行種別
            <select
              disabled={!isSpaceActive}
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
        ) : null}
        {!isRequestMode && props.transactionForm.actorType === 'member' ? (
          <label>
            実行者
            <select
              disabled={!isSpaceActive}
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
        {isRequestMode ? (
          <div className="request-rule-box">
            <strong>申請ルール</strong>
            <ul className="request-rule-list">
              {requestRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <label>
          {props.transactionForm.kind === 'consume' ? '使用元' : '操作元'}
          <select
            disabled={!isSpaceActive}
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
              disabled={!isSpaceActive}
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
            disabled={!isSpaceActive}
            value={props.transactionForm.note}
            onChange={(event) => props.onTransactionFieldChange('note', event.target.value)}
            placeholder={isRequestMode ? '例: host approval needed' : '例: Round 1 reward'}
          />
        </label>
        <button type="submit" disabled={props.submittingTransaction || !isSpaceActive}>
          {props.submittingTransaction ? '送信中...' : isRequestMode ? '承認申請を送る' : '取引を記録する'}
        </button>
      </form>
    </article>
  );
}