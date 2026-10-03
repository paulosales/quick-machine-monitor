import { describe, it, expect, vi } from 'vitest';
import { createRepository, MAX_ROWS } from '../src/repository.js';

describe('repository', () => {
  it('listServices returns names', async () => {
    const pool = { query: vi.fn(async () => [[{ service_name: 'a' }, { service_name: 'b' }]]) };
    expect(await createRepository(pool).listServices()).toEqual(['a', 'b']);
    expect(pool.query.mock.calls[0][0]).toContain('FROM services');
  });

  it('getMetrics builds a parameterized query and maps rows', async () => {
    const ts = new Date('2026-01-01T10:00:00Z');
    const pool = {
      query: vi.fn(async () => [[{ timestamp: ts, service_name: 'a', hostname: 'h', cpu_usage_pct: 1.5 }]]),
    };
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-01-02T00:00:00Z');
    const rows = await createRepository(pool).getMetrics({ from, to, services: ['a'] });

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('service_name IN (?)');
    expect(params).toEqual([from, to, ['a'], MAX_ROWS]);
    expect(rows).toEqual([
      { timestamp: '2026-01-01T10:00:00.000Z', service: 'a', hostname: 'h', cpu_usage_pct: 1.5 },
    ]);
  });

  it('omits the service filter when none is given', async () => {
    const pool = { query: vi.fn(async () => [[]]) };
    await createRepository(pool).getMetrics({ from: new Date(), to: new Date(), services: [] });
    expect(pool.query.mock.calls[0][0]).not.toContain('service_name IN');
  });
});
