import { useEffect, useState } from 'react';
import { fetchMetrics, fetchServices } from '../api.js';
import { defaultRange, localInputToUtcIso } from '../dateRange.js';
import { METRICS } from '../metrics.js';
import MetricChart from './MetricChart.jsx';

export default function Dashboard() {
  const [range, setRange] = useState(() => defaultRange());
  const [services, setServices] = useState([]);
  const [service, setService] = useState('');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(r, svc = service) {
    const from = localInputToUtcIso(r.from);
    const to = localInputToUtcIso(r.to);
    if (!from || !to) return setError('Please enter a valid date range.');
    if (from > to) return setError('The start must be before the end.');
    setLoading(true);
    setError('');
    try {
      setData(await fetchMetrics(from, to, svc));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(range);
    fetchServices().then(setServices).catch((err) => setError(err.message));
    // Initial load only; later loads are triggered by the Apply button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasData = Object.keys(data).length > 0;

  return (
    <main className="dashboard">
      <header className="topbar">
        <h1>Quick Monitor</h1>
        <form
          className="filters"
          onSubmit={(e) => {
            e.preventDefault();
            load(range);
          }}
        >
          <label>
            From
            <input
              type="datetime-local"
              step="1"
              value={range.from}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
              required
            />
          </label>
          <label>
            To
            <input
              type="datetime-local"
              step="1"
              value={range.to}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
              required
            />
          </label>
          <label>
            Service
            <select value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">All services</option>
              {services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={loading}>Apply</button>
          <button type="button" className="secondary" onClick={() => { const r = defaultRange(); setRange(r); load(r); }}>
            Today
          </button>
        </form>
      </header>

      {error && <p role="alert" className="error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && !error && !hasData && <p>No data for the selected period.</p>}

      {hasData && (
        <div className="grid">
          {METRICS.map((m) => (
            <MetricChart key={m.key} metric={m} dataByService={data} />
          ))}
        </div>
      )}
    </main>
  );
}
