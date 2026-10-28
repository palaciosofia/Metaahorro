import { useEffect, useState } from 'react';
import { formatCompact, formatNumber } from '../lib/format';

const H = 258;
const TOP = 20;
const BASE = 220;
const LEFT = 60;

function useChartWidth(): number {
  const query = '(max-width: 760px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setNarrow(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return narrow ? 400 : 640;
}

function niceScale(value: number): { top: number; ticks: number[] } {
  const max = Math.max(value, 1);
  for (let exp = 10 ** Math.floor(Math.log10(max) - 1); ; exp *= 10) {
    for (const m of [1, 2, 2.5, 5]) {
      const step = m * exp;
      const count = Math.ceil(max / step);
      if (count <= 5) return { top: count * step, ticks: Array.from({ length: count + 1 }, (_, i) => i * step) };
    }
  }
}

interface Point {
  label: string;
  value: number;
}

export function BalanceLine({ points, title }: { points: Point[]; title: string }) {
  const W = useChartWidth();
  const RIGHT = W - 8;
  const xFor = (i: number, n: number) => (n === 1 ? (LEFT + RIGHT) / 2 : LEFT + 30 + (i * (RIGHT - LEFT - 56)) / (n - 1));
  const { top, ticks } = niceScale(Math.max(...points.map((p) => p.value)) * 1.08);
  const y = (v: number) => BASE - (v / top) * (BASE - TOP);
  const coords = points.map((p, i) => ({ ...p, x: xFor(i, points.length), y: y(p.value) }));
  const last = coords.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={title}>
      <g fontFamily="IBM Plex Sans, sans-serif">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={LEFT - 4} x2={RIGHT} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#6F6B63' : '#3A3835'} strokeDasharray={t === 0 ? undefined : '2 4'} />
            <text x={LEFT - 12} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#A8A398">{t === 0 ? '0' : formatCompact(t)}</text>
          </g>
        ))}
        <polyline points={coords.map((c) => `${c.x},${c.y}`).join(' ')} fill="none" stroke="#D6F27F" strokeWidth="2.4" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <g key={c.label}>
            <circle cx={c.x} cy={c.y} r={i === last ? 5 : 3.5} fill={i === last ? '#D6F27F' : '#161514'} stroke="#D6F27F" strokeWidth="2" />
            <text x={c.x} y={c.y - 12} textAnchor="middle" fontSize={i === last ? 13 : 11} fontWeight={i === last ? 600 : 500} fill="#F3F1EA">
              {formatCompact(c.value)}
            </text>
            <text x={c.x} y={246} textAnchor="middle" fontSize="12" fill={i === last ? '#F3F1EA' : '#A8A398'} fontWeight={i === last ? 600 : 400}>
              {c.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

interface PairGroup {
  label: string;
  deposits: number;
  withdrawals: number;
}

const thousands = (v: number) => formatNumber(Math.round(v / 1000));

export function DepositWithdrawalBars({ groups, title }: { groups: PairGroup[]; title: string }) {
  const W = useChartWidth();
  const RIGHT = W - 8;
  const { top, ticks } = niceScale(Math.max(1, ...groups.flatMap((g) => [g.deposits, g.withdrawals])) * 1.12);
  const h = (v: number) => (v / top) * (BASE - TOP);
  const step = (RIGHT - LEFT - 20) / groups.length;
  const bw = Math.min(23, step / 2 - 4);
  const last = groups.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={title}>
      <g fontFamily="IBM Plex Sans, sans-serif">
        {ticks.slice(1).map((t) => (
          <line key={t} x1={LEFT} x2={RIGHT} y1={BASE - h(t)} y2={BASE - h(t)} stroke="#D6D0C4" strokeDasharray="2 4" />
        ))}
        {ticks.map((t) => (
          <text key={t} x={LEFT - 10} y={BASE - h(t) + 4} textAnchor="end" fontSize="11" fill="#6F6B63">{t === 0 ? '0' : formatCompact(t)}</text>
        ))}
        {groups.map((g, i) => {
          const c = LEFT + 10 + step * (i + 0.5);
          return (
            <g key={g.label}>
              {g.deposits > 0 && (
                <>
                  <rect x={c - bw - 1.5} y={BASE - h(g.deposits)} width={bw} height={h(g.deposits)} fill="#D6F27F" stroke="#1C1B19" />
                  <text x={c - bw / 2 - 1.5} y={BASE - h(g.deposits) - 6} textAnchor="middle" fontSize="10.5" fill="#3F3C36">{thousands(g.deposits)}</text>
                </>
              )}
              {g.withdrawals > 0 && (
                <>
                  <rect x={c + 1.5} y={BASE - h(g.withdrawals)} width={bw} height={h(g.withdrawals)} fill="#CBBEF8" stroke="#1C1B19" />
                  <text x={c + bw / 2 + 1.5} y={BASE - h(g.withdrawals) - 6} textAnchor="middle" fontSize="10.5" fill="#3F3C36">{thousands(g.withdrawals)}</text>
                </>
              )}
              <text x={c} y={246} textAnchor="middle" fontSize="12" fill={i === last ? '#1C1B19' : '#57534B'} fontWeight={i === last ? 600 : 400}>{g.label}</text>
            </g>
          );
        })}
        <line x1={LEFT} x2={RIGHT} y1={BASE} y2={BASE} stroke="#1C1B19" />
      </g>
    </svg>
  );
}

export function VariationBars({ items, title }: { items: Point[]; title: string }) {
  const W = useChartWidth();
  const RIGHT = W - 8;
  const max = Math.max(0, ...items.map((i) => i.value));
  const min = Math.min(0, ...items.map((i) => i.value));
  const span = niceScale((max - min) * 1.15 || 1).top;
  const scale = (BASE - TOP) / span;
  const zero = TOP + (max > 0 ? (max / (max - min || 1)) * (BASE - TOP - 20) + 10 : 10);
  const step = (RIGHT - LEFT - 20) / items.length;
  const last = items.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={title}>
      <g fontFamily="IBM Plex Sans, sans-serif">
        {items.map((it, i) => {
          const c = LEFT + 10 + step * (i + 0.5);
          const bw = Math.min(44, step - 16);
          const hgt = Math.max(Math.abs(it.value) * scale, it.value === 0 ? 0 : 2);
          const y = it.value >= 0 ? zero - hgt : zero;
          return (
            <g key={it.label}>
              <rect x={c - bw / 2} y={y} width={bw} height={hgt} fill={it.value >= 0 ? '#D6F27F' : '#F2C14E'} stroke="#161514" />
              <text x={c} y={it.value >= 0 ? y - 8 : y + hgt + 16} textAnchor="middle" fontSize="12" fontWeight="600" fill="#F3F1EA">
                {it.value > 0 ? '+' : it.value < 0 ? '−' : ''}{formatCompact(Math.abs(it.value))}
              </text>
              <text x={c} y={248} textAnchor="middle" fontSize="12" fill={i === last ? '#F3F1EA' : '#A8A398'} fontWeight={i === last ? 600 : 400}>{it.label}</text>
            </g>
          );
        })}
        <line x1={LEFT - 20} x2={RIGHT} y1={zero} y2={zero} stroke="#6F6B63" />
      </g>
    </svg>
  );
}
