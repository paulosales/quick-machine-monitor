import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { createRepository } from './repository.js';
import { createApp } from './app.js';

const config = loadConfig();
const app = createApp({ config, repo: createRepository(createPool(config.db)) });

app.listen(config.port, () => {
  console.log(`quick-monitor backend listening on port ${config.port}`);
});
