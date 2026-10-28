import { formatNumber } from '../lib/format';

interface Props {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
}

export function AmountInput({ id, value, onChange, invalid, describedBy, autoFocus }: Props) {
  return (
    <input
      id={id}
      className="in money num"
      inputMode="numeric"
      autoComplete="off"
      autoFocus={autoFocus}
      placeholder="$ 0"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={value === null ? '' : `$ ${formatNumber(value)}`}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
        onChange(digits ? Number(digits) : null);
      }}
    />
  );
}
