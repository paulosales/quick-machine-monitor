export const METRICS = [
  {
    key: 'cpu_usage_pct',
    label: 'CPU Usage',
    unit: '%',
    description:
      'Percentage of CPU time spent running user, nice and system work over a one-second sample.',
    impact:
      'Sustained values near 100% leave no headroom: requests queue up, response times grow and the service may time out.',
  },
  {
    key: 'load_avg_1min',
    label: 'Load Average (1 min)',
    unit: '',
    description:
      'Average number of processes running or waiting for CPU/IO during the last minute.',
    impact:
      'A load higher than the number of CPU cores means work is waiting, which increases latency even if CPU usage looks moderate.',
  },
  {
    key: 'mem_usage_pct',
    label: 'Memory Usage',
    unit: '%',
    description: 'Percentage of physical memory in use on the machine.',
    impact:
      'High usage forces swapping or triggers the OOM killer, causing severe slowdowns or abrupt process restarts.',
  },
  {
    key: 'disk_usage_pct',
    label: 'Disk Usage',
    unit: '%',
    description: 'Percentage of the root filesystem that is full.',
    impact:
      'A nearly full disk makes writes (logs, temp files, databases) fail and can crash the service.',
  },
  {
    key: 'net_rx_bytes_sec',
    label: 'Network RX',
    unit: 'B/s',
    description: 'Bytes received per second on the active network interface.',
    impact:
      'Values close to the link capacity cause packet loss and retransmissions, slowing every remote call.',
  },
  {
    key: 'net_tx_bytes_sec',
    label: 'Network TX',
    unit: 'B/s',
    description: 'Bytes transmitted per second on the active network interface.',
    impact:
      'Saturated outbound bandwidth delays responses to clients and can throttle large payloads.',
  },
  {
    key: 'disk_io_reads',
    label: 'Disk Reads',
    unit: '',
    description: 'Number of disk read operations in the sample.',
    impact:
      'Heavy read activity means data is not served from cache; slow disks directly increase request latency.',
  },
  {
    key: 'disk_io_writes',
    label: 'Disk Writes',
    unit: '',
    description: 'Number of disk write operations in the sample.',
    impact:
      'Write bursts can saturate the disk and block threads waiting on I/O (logging, persistence).',
  },
  {
    key: 'jvm_threads',
    label: 'JVM Threads',
    unit: '',
    description: 'Number of threads in the Java process.',
    impact:
      'A growing thread count may indicate leaks or blocked pools; too many threads increase context switching and memory use.',
  },
  {
    key: 'jvm_heap_used_mb',
    label: 'JVM Heap Used',
    unit: 'MB',
    description: 'Memory used by the Java process (heap, or resident memory when heap data is unavailable).',
    impact:
      'Heap close to its limit causes frequent garbage collection pauses and eventually OutOfMemoryError.',
  },
  {
    key: 'db_connect_sec',
    label: 'DB Connect Time',
    unit: 's',
    description: 'Time taken to open a connection to the database and run a trivial query.',
    impact:
      'Slow connections point to network or database saturation and delay every request that needs the database.',
  },
  {
    key: 'db_write_sec',
    label: 'DB Write Time',
    unit: 's',
    description: 'Time taken to insert a row into the database.',
    impact:
      'Slow writes indicate lock contention, I/O pressure or replication lag, slowing any transaction that persists data.',
  },
  {
    key: 'db_read_sec',
    label: 'DB Read Time',
    unit: 's',
    description: 'Time taken to run a simple indexed read against the database.',
    impact:
      'Slow reads increase page load and API response times and can exhaust the connection pool.',
  },
];
