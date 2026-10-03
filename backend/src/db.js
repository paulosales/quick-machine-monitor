import mysql from 'mysql2/promise';

export function createPool(dbConfig) {
  const pool = mysql.createPool({
    ...dbConfig,
    connectionLimit: 10,
    decimalNumbers: true,
    // Timestamps are stored in UTC; parse them as UTC.
    timezone: 'Z',
  });
  pool.pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));
  return pool;
}
