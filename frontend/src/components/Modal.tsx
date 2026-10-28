import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './Icons';

interface Props {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, kicker, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <div>
          {kicker && <p className="k">{kicker}</p>}
          <h2 id="modal-title" className="s">{title}</h2>
        </div>
        <button type="button" className="bt" aria-label="Cerrar" onClick={onClose}><IconClose /></button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
