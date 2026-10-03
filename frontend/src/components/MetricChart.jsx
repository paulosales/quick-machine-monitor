import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatLocal } from '../dateRange.js';

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

// Converts API points into recharts rows with a numeric epoch-ms x value.
export function toSeries(points, metricKey) {
  return points
    .filter((p) => p[metricKey] !== null && p[metricKey] !== undefined)
    .map((p) => ({ t: new Date(p.timestamp).getTime(), value: Number(p[metricKey]) }));
}

export default function MetricChart({ metric, dataByService }) {
  const [open, setOpen] = useState(false);
  const services = Object.keys(dataByService).sort();
  const descId = `desc-${metric.key}`;

  return (
    <section className="card chart">
      <header>
        <h2>
          {metric.label}
          {metric.unit && <span className="unit"> ({metric.unit})</span>}
        </h2>
        <button
          type="button"
          className="help"
          aria-label={`About ${metric.label}`}
          aria-expanded={open}
          aria-controls={descId}
          onClick={() => setOpen((o) => !o)}
        >
          ?
        </button>
      </header>
      {open && (
        <div id={descId} className="description" role="note">
          <p>{metric.description}</p>
          <p><strong>Why it matters:</strong> {metric.impact}</p>
        </div>
      )}
      <div className="plot">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatLocal}
              minTickGap={48}
              tick={{ fontSize: 11 }}
            />
            <YAxis width={60} tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={formatLocal} />
            <Legend />
            {services.map((svc, i) => (
              <Line
                key={svc}
                name={svc}
                data={toSeries(dataByService[svc], metric.key)}
                dataKey="value"
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
