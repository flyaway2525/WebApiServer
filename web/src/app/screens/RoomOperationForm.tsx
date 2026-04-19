import { FormEventHandler } from 'react';

import { Space, SpaceMember, TransactionActorType, TransactionForm, TransactionKind } from '../types';

type RoomOperationFormProps = {
  selectedSpace: Space;
  members: SpaceMember[];
  transactionError: string | null;
  transactionForm: TransactionForm;
  submittingTransaction: boolean;
  onTransactionFieldChange: <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => void;
  onSubmitTransaction: FormEventHandler<HTMLFormElement>;
};

export function RoomOperationForm(props: RoomOperationFormProps) {
  return (
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
  );
}