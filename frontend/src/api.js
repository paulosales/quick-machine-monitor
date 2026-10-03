export class ApiError extends Error {}

async function get(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export async function fetchServices() {
  return (await get('/api/services')).services;
}

// fromIso/toIso are UTC ISO-8601 strings; service is optional (all services when empty).
export async function fetchMetrics(fromIso, toIso, service = '') {
  const qs = new URLSearchParams({ from: fromIso, to: toIso });
  if (service) qs.set('services', service);
  return (await get(`/api/metrics?${qs}`)).data;
}
