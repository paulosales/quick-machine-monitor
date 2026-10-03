export const METRIC_COLUMNS = [
  'jvm_threads',
  'jvm_heap_used_mb',
  'load_avg_1min',
  'cpu_usage_pct',
  'mem_usage_pct',
  'disk_usage_pct',
  'net_rx_bytes_sec',
  'net_tx_bytes_sec',
  'disk_io_reads',
  'disk_io_writes',
  'db_connect_sec',
  'db_write_sec',
  'db_read_sec',
];

export const MAX_ROWS = 20000;

export function createRepository(pool) {
  return {
    async listServices() {
      const [rows] = await pool.query(
        'SELECT service_name FROM services ORDER BY service_name',
      );
      return rows.map((r) => r.service_name);
    },

    // from/to are Date objects (absolute instants).
    async getMetrics({ from, to, services }) {
      const params = [from, to];
      let sql =
        `SELECT timestamp, service_name, hostname, ${METRIC_COLUMNS.join(', ')} ` +
        'FROM machine_health WHERE timestamp >= ? AND timestamp <= ?';
      if (services && services.length > 0) {
        sql += ' AND service_name IN (?)';
        params.push(services);
      }
      sql += ' ORDER BY timestamp ASC LIMIT ?';
      params.push(MAX_ROWS);

      const [rows] = await pool.query(sql, params);
      return rows.map(({ timestamp, service_name, hostname, ...metrics }) => ({
        timestamp: new Date(timestamp).toISOString(),
        service: service_name,
        hostname,
        ...metrics,
      }));
    },
  };
}
