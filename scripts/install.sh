#!/bin/sh
# Installs (or reconfigures) monitor.sh on Alpine Linux and schedules it with cron.
# Safe to re-run: existing values are offered as defaults and the cron entries are replaced.
# Optional env: MONITOR_URL (download URL), INSTALL_DIR (default /usr/local/bin)
set -eu

if [ "$(id -u)" -ne 0 ]; then
    echo "Error: run as root." >&2
    exit 1
fi
if [ ! -r /dev/tty ]; then
    echo "Error: an interactive terminal is required." >&2
    exit 1
fi

INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
TARGET="$INSTALL_DIR/monitor.sh"
CONF_FILE=/etc/quick-monitor.conf
CRON_FILE=/etc/crontabs/root
MONITOR_URL=https://raw.githubusercontent.com/paulosales/quick-machine-monitor/refs/heads/master/scripts/monitor.sh

# Load previous values (if any) as defaults.
env_url="${MONITOR_URL:-}"
DB_HOST=; DB_USER=; DB_PASS=; DB_NAME=; SERVICE_NAME=; MONITOR_URL=; INTERVAL=
if [ -r "$CONF_FILE" ]; then
    . "$CONF_FILE"
    echo "Existing configuration found; press Enter to keep the value in brackets."
fi
[ -n "$env_url" ] && MONITOR_URL="$env_url"

# ask VAR "Prompt" [default]; repeats until non-empty.
ask() {
    while :; do
        if [ -n "$3" ]; then printf '%s [%s]: ' "$2" "$3" >/dev/tty; else printf '%s: ' "$2" >/dev/tty; fi
        read -r ans </dev/tty || ans=
        [ -z "$ans" ] && ans="$3"
        if [ -n "$ans" ]; then eval "$1=\$ans"; return; fi
    done
}

ask_secret() {
    while :; do
        if [ -n "$DB_PASS" ]; then printf 'DB password [keep current]: ' >/dev/tty; else printf 'DB password: ' >/dev/tty; fi
        stty -echo </dev/tty
        read -r ans </dev/tty || ans=
        stty echo </dev/tty
        echo >/dev/tty
        [ -z "$ans" ] && ans="$DB_PASS"
        if [ -n "$ans" ]; then DB_PASS="$ans"; return; fi
    done
}

ask MONITOR_URL "URL to download monitor.sh" "$MONITOR_URL"
ask DB_HOST "DB host" "$DB_HOST"
ask DB_USER "DB user" "$DB_USER"
ask_secret
ask DB_NAME "DB name" "${DB_NAME:-health_monitor}"
ask SERVICE_NAME "Service name" "$SERVICE_NAME"

cat >/dev/tty <<'EOF'
Execution interval:
  1) every 20 seconds
  2) every minute
  3) every 2 minutes
  4) every 3 minutes
  5) every 5 minutes
  6) every 10 minutes
  7) every 15 minutes
  8) every hour
EOF
case "$INTERVAL" in 20s) def=1 ;; 1m) def=2 ;; 2m) def=3 ;; 3m) def=4 ;; 5m) def=5 ;; 10m) def=6 ;; 15m) def=7 ;; 1h) def=8 ;; *) def=2 ;; esac
while :; do
    printf 'Choose [%s]: ' "$def" >/dev/tty
    read -r choice </dev/tty || choice=
    [ -z "$choice" ] && choice="$def"
    case "$choice" in
        1) INTERVAL=20s; break ;;
        2) INTERVAL=1m; break ;;
        3) INTERVAL=2m; break ;;
        4) INTERVAL=3m; break ;;
        5) INTERVAL=5m; break ;;
        6) INTERVAL=10m; break ;;
        7) INTERVAL=15m; break ;;
        8) INTERVAL=1h; break ;;
    esac
done

apk update >/dev/null
apk add --no-cache wget mariadb-client procps >/dev/null
apk add openrc

mkdir -p "$INSTALL_DIR"
wget -q -O "$TARGET.tmp" "$MONITOR_URL"
chmod 755 "$TARGET.tmp"
mv "$TARGET.tmp" "$TARGET"

# Single-quote a value for safe sourcing by sh.
q() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"; }

umask 077
{
    echo "DB_HOST=$(q "$DB_HOST")"
    echo "DB_USER=$(q "$DB_USER")"
    echo "DB_PASS=$(q "$DB_PASS")"
    echo "DB_NAME=$(q "$DB_NAME")"
    echo "SERVICE_NAME=$(q "$SERVICE_NAME")"
    echo "MONITOR_URL=$(q "$MONITOR_URL")"
    echo "INTERVAL=$(q "$INTERVAL")"
} > "$CONF_FILE.tmp"
chmod 600 "$CONF_FILE.tmp"
mv "$CONF_FILE.tmp" "$CONF_FILE"

# Replace any previous entries for this script.
touch "$CRON_FILE"
grep -vF "$TARGET" "$CRON_FILE" > "$CRON_FILE.tmp" || true
# Cron has 1-minute granularity; 20s uses three staggered entries.
case "$INTERVAL" in
    20s)
        echo "* * * * * $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp"
        echo "* * * * * sleep 20; $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp"
        echo "* * * * * sleep 40; $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp"
        ;;
    1m)  echo "* * * * * $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp" ;;
    2m)  echo "*/2 * * * * $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp" ;;
    3m)  echo "*/3 * * * * $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp" ;;
    5m)  echo "*/5 * * * * $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp" ;;
    10m) echo "*/10 * * * * $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp" ;;
    15m) echo "*/15 * * * * $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp" ;;
    1h)  echo "0 * * * * $TARGET >/dev/null 2>&1" >> "$CRON_FILE.tmp" ;;
esac
mv "$CRON_FILE.tmp" "$CRON_FILE"

if command -v rc-service >/dev/null 2>&1; then
    rc-update add crond default >/dev/null 2>&1 || true
    rc-service crond restart >/dev/null 2>&1 || rc-service crond start >/dev/null 2>&1 || true
else
    echo "OpenRC not found (container?). Start cron manually with: crond -b" >&2
fi

pgrep crond >/dev/null || crond -b

echo "Installed $TARGET (interval: $INTERVAL). Configuration: $CONF_FILE"
echo "Test it with: $TARGET"
