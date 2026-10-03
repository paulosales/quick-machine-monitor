import { describe, it, expect, vi } from 'vitest';
import { fetchMetrics, fetchServices, ApiError } from './api.js';

function mockFetch(status, body) {
  globalThis.fetch = vi.fn(async () => ({ ok: status < 400, status, json: async () => body }));
}

describe('api', () => {
  it('fetchMetrics sends the UTC range and returns the data', async () => {
    mockFetch(200, { data: { svc: [] } });
    const data = await fetchMetrics('2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z');
    expect(data).toEqual({ svc: [] });
    const [url] = fetch.mock.calls[0];
    expect(url).toContain('from=2026-01-01T00%3A00%3A00.000Z');
  });

  it('fetchMetrics sends the service filter only when set', async () => {
    mockFetch(200, { data: {} });
    await fetchMetrics('a', 'b', 'api');
    expect(fetch.mock.calls[0][0]).toContain('services=api');
    await fetchMetrics('a', 'b');
    expect(fetch.mock.calls[1][0]).not.toContain('services=');
  });

  it('fetchServices returns the service names', async () => {
    mockFetch(200, { services: ['a', 'b'] });
    expect(await fetchServices()).toEqual(['a', 'b']);
    expect(fetch.mock.calls[0][0]).toBe('/api/services');
  });

  it('fetchMetrics throws ApiError with the server message', async () => {
    mockFetch(400, { error: 'bad range' });
    const err = await fetchMetrics('a', 'b').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('bad range');
  });
});
