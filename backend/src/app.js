import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { metricsRouter } from './routes/metrics.js';

export function createApp({ config, repo }) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', metricsRouter({ repo }));

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
