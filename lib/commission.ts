export const COMMISSION_STATUS = { closed: 0, open: 1 } as const;
export function isCommissionOpen(value: unknown) { return Number(value) === COMMISSION_STATUS.open; }
