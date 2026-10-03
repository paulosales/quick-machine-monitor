import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MetricChart, { toSeries } from './MetricChart.jsx';
import { METRICS } from '../metrics.js';

// ResponsiveContainer needs layout, which jsdom lacks.
vi.mock('recharts', async (orig) => {
  const actual = await orig();
  return { ...actual, ResponsiveContainer: ({ children }) => <div>{children}</div> };
});

const metric = METRICS.find((m) => m.key === 'cpu_usage_pct');

describe('toSeries', () => {
  it('maps timestamps to epoch ms and drops null values', () => {
    const pts = [
      { timestamp: '2026-01-01T00:00:00.000Z', cpu_usage_pct: '12.5' },
      { timestamp: '2026-01-01T00:01:00.000Z', cpu_usage_pct: null },
    ];
    expect(toSeries(pts, 'cpu_usage_pct')).toEqual([{ t: Date.parse('2026-01-01T00:00:00.000Z'), value: 12.5 }]);
  });
});

describe('MetricChart', () => {
  it('toggles the metric description with the question mark button', async () => {
    render(<MetricChart metric={metric} dataByService={{ api: [] }} />);
    const btn = screen.getByRole('button', { name: /about cpu usage/i });
    expect(screen.queryByRole('note')).not.toBeInTheDocument();

    await userEvent.click(btn);
    expect(screen.getByRole('note')).toHaveTextContent(metric.description);
    expect(screen.getByRole('note')).toHaveTextContent('Why it matters');

    await userEvent.click(btn);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
