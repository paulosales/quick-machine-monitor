import { Router } from 'express';

function parseDate(value) {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function metricsRouter({ repo }) {
  const router = Router();

  router.get('/services', async (req, res, next) => {
    try {
      res.json({ services: await repo.listServices() });
    } catch (err) {
      next(err);
    }
  });

  // from/to: ISO-8601 instants (UTC). services: optional comma-separated list.
  router.get('/metrics', async (req, res, next) => {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to must be valid ISO-8601 dates' });
    }
    if (from > to) {
      return res.status(400).json({ error: 'from must be before to' });
    }
    const services =
      typeof req.query.services === 'string'
        ? req.query.services.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    try {
      const rows = await repo.getMetrics({ from, to, services });
      const byService = {};
      for (const { service, ...point } of rows) {
        (byService[service] ||= []).push(point);
      }
      res.json({ from: from.toISOString(), to: to.toISOString(), data: byService });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
