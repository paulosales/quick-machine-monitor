import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const config = { corsOrigin: 'http://localhost:5173' };

let repo;
let app;

beforeEach(() => {
  repo = {
    listServices: vi.fn(async () => ['auth-service', 'api']),
    getMetrics: vi.fn(async () => [
      { timestamp: '2026-01-01T10:00:00.000Z', service: 'api', cpu_usage_pct: 10 },
      { timestamp: '2026-01-01T10:01:00.000Z', service: 'api', cpu_usage_pct: 20 },
      { timestamp: '2026-01-01T10:00:00.000Z', service: 'auth-service', cpu_usage_pct: 5 },
    ]),
  };
  app = createApp({ config, repo });
});

describe('GET /api/services', () => {
  it('lists services without authentication', async () => {
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(res.body.services).toEqual(['auth-service', 'api']);
  });
});

describe('GET /api/metrics', () => {
  const q = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-02T00:00:00.000Z' };

  it('groups data by service', async () => {
    const res = await request(app).get('/api/metrics').query(q);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data)).toEqual(['api', 'auth-service']);
    expect(res.body.data.api).toHaveLength(2);
    expect(res.body.data.api[0].service).toBeUndefined();
  });

  it('passes parsed dates and services to the repository', async () => {
    await request(app)
      .get('/api/metrics')
      .query({ ...q, services: 'api, auth-service' });
    const arg = repo.getMetrics.mock.calls[0][0];
    expect(arg.from).toEqual(new Date(q.from));
    expect(arg.to).toEqual(new Date(q.to));
    expect(arg.services).toEqual(['api', 'auth-service']);
  });

  it('validates the date range', async () => {
    expect((await request(app).get('/api/metrics')).status).toBe(400);
    expect((await request(app).get('/api/metrics').query({ from: 'x', to: q.to })).status).toBe(400);
    expect((await request(app).get('/api/metrics').query({ from: q.to, to: q.from })).status).toBe(400);
  });

  it('returns 500 on repository errors', async () => {
    repo.getMetrics.mockRejectedValueOnce(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await request(app).get('/api/metrics').query(q)).status).toBe(500);
  });
});
