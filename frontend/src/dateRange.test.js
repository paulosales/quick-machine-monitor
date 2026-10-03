import { describe, it, expect } from 'vitest';
import { defaultRange, localInputToUtcIso, toLocalInputValue } from './dateRange.js';

describe('dateRange', () => {
  it('toLocalInputValue formats local wall-clock time', () => {
    expect(toLocalInputValue(new Date(2026, 0, 5, 3, 4, 9))).toBe('2026-01-05T03:04:09');
  });

  it('defaultRange spans today 00:00:00 to now (local)', () => {
    const now = new Date(2026, 5, 15, 14, 30, 45);
    expect(defaultRange(now)).toEqual({ from: '2026-06-15T00:00:00', to: '2026-06-15T14:30:45' });
  });

  it('localInputToUtcIso converts local time to the matching UTC instant', () => {
    const local = new Date(2026, 5, 15, 8, 0, 0);
    expect(localInputToUtcIso('2026-06-15T08:00:00')).toBe(local.toISOString());
  });

  it('localInputToUtcIso returns null for invalid input', () => {
    expect(localInputToUtcIso('')).toBeNull();
    expect(localInputToUtcIso('nope')).toBeNull();
  });
});
