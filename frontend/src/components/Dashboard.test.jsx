import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard.jsx';
import * as api from '../api.js';
import { METRICS } from '../metrics.js';

vi.mock('../api.js', () => ({ fetchMetrics: vi.fn(), fetchServices: vi.fn() }));
vi.mock('./MetricChart.jsx', () => ({ default: ({ metric }) => <div data-testid="chart">{metric.label}</div> }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 5, 15, 14, 30, 0));
  api.fetchMetrics.mockResolvedValue({ svc: [{ timestamp: '2026-06-15T10:00:00.000Z' }] });
  api.fetchServices.mockResolvedValue(['svc', 'other']);
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Dashboard', () => {
  it('loads today by default, sending UTC instants of the local range', async () => {
    render(<Dashboard />);
    await waitFor(() => expect(api.fetchMetrics).toHaveBeenCalledTimes(1));
    const [from, to] = api.fetchMetrics.mock.calls[0];
    expect(from).toBe(new Date(2026, 5, 15, 0, 0, 0).toISOString());
    expect(to).toBe(new Date(2026, 5, 15, 14, 30, 0).toISOString());
    expect(await screen.findAllByTestId('chart')).toHaveLength(METRICS.length);
  });

  it('refetches when the user applies a new range', async () => {
    render(<Dashboard />);
    await screen.findAllByTestId('chart');
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-06-10T08:00:00' } });
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(api.fetchMetrics).toHaveBeenCalledTimes(2));
    expect(api.fetchMetrics.mock.calls[1][0]).toBe(new Date(2026, 5, 10, 8, 0, 0).toISOString());
  });

  it('populates the service dropdown and filters by the selected service', async () => {
    render(<Dashboard />);
    await screen.findByRole('option', { name: 'other' });
    expect(api.fetchMetrics.mock.calls[0][2]).toBe('');
    await userEvent.selectOptions(screen.getByLabelText('Service'), 'other');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(api.fetchMetrics).toHaveBeenCalledTimes(2));
    expect(api.fetchMetrics.mock.calls[1][2]).toBe('other');
  });

  it('shows an empty state', async () => {
    api.fetchMetrics.mockResolvedValue({});
    render(<Dashboard />);
    expect(await screen.findByText(/no data/i)).toBeInTheDocument();
  });

  it('shows API errors', async () => {
    api.fetchMetrics.mockRejectedValue(new Error('boom'));
    render(<Dashboard />);
    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  });
});
