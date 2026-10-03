export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 3000,
    corsOrigin: env.CORS_ORIGIN || 'http://localhost:5173',
    db: {
      host: env.DB_HOST || 'localhost',
      port: Number(env.DB_PORT) || 3306,
      user: env.DB_USER,
      password: env.DB_PASS,
      database: env.DB_NAME || 'health_monitor',
    },
  };
}
