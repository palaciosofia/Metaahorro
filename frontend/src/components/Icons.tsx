const base = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const;

export const IconPrev = () => (
  <svg {...base}><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" /></svg>
);
export const IconNext = () => (
  <svg {...base}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" /></svg>
);
export const IconPlus = () => (
  <svg {...base} width={14} height={14}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" /></svg>
);
export const IconMore = () => (
  <svg {...base} width={18} height={18} fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
);
export const IconClose = () => (
  <svg {...base}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" /></svg>
);
