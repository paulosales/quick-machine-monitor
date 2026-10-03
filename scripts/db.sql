-- health_monitor.machine_health definition

CREATE TABLE `machine_health` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `hostname` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jvm_pid` int DEFAULT NULL,
  `jvm_threads` int DEFAULT NULL,
  `jvm_heap_used_mb` decimal(10,2) DEFAULT NULL,
  `load_avg_1min` decimal(5,2) NOT NULL,
  `cpu_usage_pct` decimal(5,2) NOT NULL,
  `mem_usage_pct` decimal(5,2) NOT NULL,
  `disk_usage_pct` decimal(5,2) NOT NULL,
  `net_rx_bytes_sec` bigint NOT NULL,
  `net_tx_bytes_sec` bigint NOT NULL,
  `disk_io_reads` bigint NOT NULL,
  `disk_io_writes` bigint NOT NULL,
  `db_connect_sec` decimal(6,4) DEFAULT NULL,
  `db_write_sec` decimal(6,4) DEFAULT NULL,
  `db_read_sec` decimal(6,4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_hostname` (`hostname`),
  KEY `idx_service_name` (`service_name`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `services` (
    `id` int NOT NULL AUTO_INCREMENT,
    `service_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_service_name` (`service_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
