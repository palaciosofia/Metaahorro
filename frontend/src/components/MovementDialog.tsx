import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { api } from '../api/endpoints';
import type { Goal, MovementResult, MovementType } from '../api/types';
import { formatMoney } from '../lib/format';
import { AmountInput } from './AmountInput';
import { Modal } from './Modal';

interface Props {
  goal: Goal;
  type: MovementType;
  onClose: () => void;
  onDone: (result: MovementResult) => void;
}

export function MovementDialog({ goal, type, onClose, onDone }: Props) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const isDeposit = type === 'DEPOSIT';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      onDone(await api.createMovement(goal.id, { type, amount: amount ?? 0 }, idempotencyKey));
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'ERROR', 'No se pudo registrar el movimiento'));
    } finally {
      setSaving(false);
    }
  }

  const amountError = error?.fieldError('amount');
  const after = amount === null ? goal.balance : goal.balance + (isDeposit ? amount : -amount);

  return (
    <Modal title={isDeposit ? 'Depositar' : 'Retirar'} kicker={goal.name} onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label className="lab" htmlFor="mov-amount">Monto</label>
          <AmountInput id="mov-amount" value={amount} onChange={setAmount} invalid={!!amountError} describedBy="mov-amount-hint" autoFocus />
          {amountError && <span className="field-error">{amountError}</span>}
        </div>
        <table className="l bare" id="mov-amount-hint">
          <tbody>
            <tr><td className="mu2">Saldo actual</td><td className="r num">{formatMoney(goal.balance)}</td></tr>
            <tr>
              <td className="mu2">Saldo después</td>
              <td className="r num" style={{ fontWeight: 600, color: after < 0 ? 'var(--danger)' : undefined }}>
                {after < 0 ? 'Saldo insuficiente' : formatMoney(after)}
              </td>
            </tr>
          </tbody>
        </table>
        {error && !amountError && <p className="form-error" role="alert">{error.message}</p>}
        <div className="modal-actions">
          <button type="button" className="btn o" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Registrando…' : isDeposit ? 'Depositar' : 'Retirar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
