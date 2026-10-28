const NBSP = ' ';
const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const formatNumber = (value: number) => numberFormat.format(value);

export const formatMoney = (value: number) => `$${NBSP}${numberFormat.format(value)}`;

export function formatSigned(value: number): string {
  if (value === 0) return '0';
  return `${value > 0 ? '+' : '−'}${NBSP}${numberFormat.format(Math.abs(value))}`;
}

export function formatSignedMoney(value: number): string {
  if (value === 0) return formatMoney(0);
  return `${value > 0 ? '+' : '−'}${NBSP}${formatMoney(Math.abs(value))}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toLocaleString('es-CO', { maximumFractionDigits: digits })}${NBSP}%`;
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    return `${sign}${millions.toLocaleString('es-CO', { maximumFractionDigits: millions >= 10 ? 0 : 2 })}${NBSP}M`;
  }
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000).toLocaleString('es-CO')}${NBSP}mil`;
  return `${sign}${abs}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

export type MonthKey = string;

export function monthKeyOf(date: Date | string): MonthKey {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseKey(key: MonthKey): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month: month - 1 };
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const { year, month } = parseKey(key);
  return monthKeyOf(new Date(year, month + delta, 1));
}

export function monthEnd(key: MonthKey): Date {
  const { year, month } = parseKey(key);
  return new Date(year, month + 1, 1);
}

export function lastDayOfMonth(key: MonthKey): number {
  const { year, month } = parseKey(key);
  return new Date(year, month + 1, 0).getDate();
}

export function monthName(key: MonthKey): string {
  const name = MONTHS[parseKey(key).month];
  return name[0].toUpperCase() + name.slice(1);
}

export function monthShort(key: MonthKey): string {
  const name = MONTHS_SHORT[parseKey(key).month];
  return name[0].toUpperCase() + name.slice(1);
}

export const monthLabel = (key: MonthKey) => `${monthName(key)} de ${parseKey(key).year}`;

export const monthLabelLower = (key: MonthKey) => `${MONTHS[parseKey(key).month]} de ${parseKey(key).year}`;

export const monthNameLower = (key: MonthKey) => MONTHS[parseKey(key).month];
