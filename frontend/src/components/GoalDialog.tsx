import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { api } from '../api/endpoints';
import type { Goal } from '../api/types';
import { AmountInput } from './AmountInput';
import { Modal } from './Modal';

interface Props {
  goal?: Goal;
  onClose: () => void;
  onSaved: (goal: Goal) => void;
}

export function GoalDialog({ goal, onClose, onSaved }: Props) {
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState<number | null>(goal?.targetAmount ?? null);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let saved: Goal;
      if (goal) {
        const changes: { name?: string; targetAmount?: number } = {};
        if (name.trim() !== goal.name) changes.name = name;
        if (target !== goal.targetAmount && target !== null) changes.targetAmount = target;
        if (Object.keys(changes).length === 0) return onClose();
        saved = await api.updateGoal(goal.id, changes);
      } else {
        saved = await api.createGoal({ name, targetAmount: target ?? 0 });
      }
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'ERROR', 'No se pudo guardar la meta'));
    } finally {
      setSaving(false);
    }
  }

  const nameError = error?.fieldError('name');
  const targetError = error?.fieldError('targetAmount');

  return (
    <Modal title={goal ? 'Editar meta' : 'Nueva meta'} kicker={goal ? goal.name : 'Metas'} onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label className="lab" htmlFor="goal-name">Nombre</label>
          <input
            id="goal-name"
            className="in"
            value={name}
            maxLength={100}
            autoFocus
            placeholder="Ej. Viaje a Cartagena"
            aria-invalid={!!nameError || undefined}
            aria-describedby={nameError ? 'goal-name-err' : undefined}
            onChange={(e) => setName(e.target.value)}
          />
          {nameError && <span id="goal-name-err" className="field-error">{nameError}</span>}
        </div>
        <div className="field">
          <label className="lab" htmlFor="goal-target">Objetivo</label>
          <AmountInput id="goal-target" value={target} onChange={setTarget} invalid={!!targetError} describedBy="goal-target-hint" />
          <span id="goal-target-hint" className={targetError ? 'field-error' : 'hint'}>
            {targetError ?? 'Cuánto quieres ahorrar en total, en pesos.'}
          </span>
        </div>
        {error && !nameError && !targetError && <p className="form-error" role="alert">{error.message}</p>}
        <div className="modal-actions">
          <button type="button" className="btn o" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Guardando…' : goal ? 'Guardar cambios' : 'Crear meta'}</button>
        </div>
      </form>
    </Modal>
  );
}
