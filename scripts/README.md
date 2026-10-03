# Scripts

- `db.sql` – creates the `machine_health` table (MySQL/MariaDB, database `health_monitor`).
- `monitor.sh` – collects machine/JVM/DB metrics and inserts them into `machine_health`. It contains no credentials; it reads them from `/etc/quick-monitor.conf`.
- `install.sh` – interactive installer for Alpine Linux: installs dependencies, downloads `monitor.sh`, stores the configuration and schedules it with cron.

## Prerequisites

1. The `machine_health` table exists (`mysql -u <user> -p health_monitor < db.sql`).
2. A DB user with INSERT/SELECT/UPDATE on `machine_health`.
3. `monitor.sh` and `install.sh` are hosted somewhere reachable by the Alpine machine over HTTP(S) (for example raw files in your Git server or an internal web server).

## Install with wget

Run as root on the Alpine machine, in an interactive terminal:

```sh
wget -qO- https://your-host/path/install.sh | sh
```

Or download and inspect it first:

```sh
wget -O install.sh https://raw.githubusercontent.com/paulosales/quick-machine-monitor/refs/heads/master/scripts/install.sh
sh install.sh
```

The installer asks for:

| Prompt | Notes |
| --- | --- |
| URL to download `monitor.sh` | Can be preset with `MONITOR_URL=... sh install.sh` |
| DB host, user, password, name | Name defaults to `health_monitor`; password is not echoed |
| Service name | Value stored in the `service_name` column |
| Execution interval | every 20 seconds, every minute, every 10 minutes or every hour |

It then installs `wget`, `mariadb-client` and `procps`, installs `monitor.sh` in `/usr/local/bin` (override with `INSTALL_DIR`), writes the settings to `/etc/quick-monitor.conf` (mode 600, root only), replaces the cron entries in `/etc/crontabs/root` and enables `crond`. The 20 second interval uses three staggered cron entries because cron's minimum granularity is one minute.

## Change the configuration

Re-run the installer. Current values are shown in brackets; press Enter to keep them (including the password). Cron entries are replaced, not duplicated.

## Verify

```sh
/usr/local/bin/monitor.sh      # prints the collected metrics
crontab -l                     # shows the schedule
```

## Uninstall

```sh
rm /usr/local/bin/monitor.sh /etc/quick-monitor.conf
sed -i '\#/usr/local/bin/monitor.sh#d' /etc/crontabs/root
```
