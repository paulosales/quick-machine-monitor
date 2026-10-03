#!/bin/sh
# --- CONFIGURATION (written by install.sh) ---
CONF_FILE="${MONITOR_CONF:-/etc/quick-monitor.conf}"
if [ ! -r "$CONF_FILE" ]; then
    echo "Error: cannot read $CONF_FILE. Run install.sh first." >&2
    exit 1
fi
. "$CONF_FILE"

HOSTNAME=$(hostname)

# Dynamic Autodetect: Find active interface
INTERFACE=$(ip route show 2>/dev/null | awk '/default/ {print $5}')
[ -z "$INTERFACE" ] && INTERFACE="eth0"

# --- Helper Function for Sub-Second Precision via /proc/uptime ---
get_now() {
    awk '{print $1}' /proc/uptime
}

# --- 1. SYSTEM METRICS COLLECTION ---
STAT1=$(awk '/^cpu /{print $2+$3+$4, $2+$3+$4+$5+$6+$7+$8}' /proc/stat)
sleep 1
STAT2=$(awk '/^cpu /{print $2+$3+$4, $2+$3+$4+$5+$6+$7+$8}' /proc/stat)

u1=$(echo "$STAT1" | awk '{print $1}')
t1=$(echo "$STAT1" | awk '{print $2}')
u2=$(echo "$STAT2" | awk '{print $1}')
t2=$(echo "$STAT2" | awk '{print $2}')

CPU_USAGE=$(awk "BEGIN {printf \"%.2f\", ($u2-$u1)/($t2-$t1)*100}")
LOAD_AVG=$(awk '{print $1}' /proc/loadavg)
MEM_USAGE=$(free | awk 'NR==2 {printf "%.2f", $3/$2 * 100}')
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')

# Network
NET_STAT_1=$(awk -v trg="$INTERFACE:" '$1 == trg {print $2, $10}' /proc/net/dev)
sleep 1
NET_STAT_2=$(awk -v trg="$INTERFACE:" '$1 == trg {print $2, $10}' /proc/net/dev)
rx1=$(echo "$NET_STAT_1" | awk '{print $1}') tx1=$(echo "$NET_STAT_1" | awk '{print $2}')
rx2=$(echo "$NET_STAT_2" | awk '{print $1}') tx2=$(echo "$NET_STAT_2" | awk '{print $2}')
NET_RX=$((rx2 - rx1)) NET_TX=$((tx2 - tx1))

DISK_READS=0
DISK_WRITES=0

# --- 2. JAVA VIRTUAL MACHINE (JVM) METRICS ---
# Locate the Java Process ID (PID)
JVM_PID=$(pgrep -f "java" | head -n 1)

if [ -n "$JVM_PID" ]; then
    # Metric 1: Count active threads via /proc entry (Highly reliable on Alpine/BusyBox)
    JVM_THREADS=$(cat /proc/$JVM_PID/status 2>/dev/null | awk '/Threads:/ {print $2}')
    [ -z "$JVM_THREADS" ] && JVM_THREADS=0

    # Metric 2: Look for native JDK diagnostics binaries to extract precise Heap Usage
    if command -v jcmd >/dev/null 2>&1; then
        # jcmd tool extraction
        JVM_HEAP_BYTES=$(jcmd "$JVM_PID" GC.heap_info 2>/dev/null | awk '/garbage-first heap|def new generation|eden space/ {for(i=1;i<=NF;i++) if($i~/[0-aligned|used]/) {print $(i+1); exit}}' | tr -d 'KMG,')
        JVM_HEAP_MB=$(awk "BEGIN {printf \"%.2f\", ${JVM_HEAP_BYTES:-0} / 1024 / 1024}")
    elif command -v jstat >/dev/null 2>&1; then
        # jstat tool backup extraction (Adds up EU + OU capacities in KB)
        JVM_HEAP_MB=$(jstat -gc "$JVM_PID" 1 1 2>/dev/null | awk 'NR==2 {printf "%.2f", ($6+$8)/1024}')
    else
        # OS Level Backup: Read Resident Set Size (RSS) directly from Linux memory states
        JVM_RSS_KB=$(awk '/VmRSS:/ {print $2}' /proc/$JVM_PID/status 2>/dev/null)
        JVM_HEAP_MB=$(awk "BEGIN {printf \"%.2f\", ${JVM_RSS_KB:-0} / 1024}")
    fi
else
    JVM_PID="NULL"
    JVM_THREADS=0
    JVM_HEAP_MB=0.00
fi

# --- 3. DB PERFORMANCE BENCHMARK ---
START_CONN=$(get_now)
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT 1;" > /dev/null 2>&1
END_CONN=$(get_now)
DB_CONNECT_TIME=$(awk "BEGIN {printf \"%.4f\", $END_CONN - $START_CONN}")

START_WRITE=$(get_now)
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF > /dev/null 2>&1
INSERT INTO machine_health (hostname, service_name, jvm_pid, jvm_threads, jvm_heap_used_mb, load_avg_1min, cpu_usage_pct, mem_usage_pct, disk_usage_pct, net_rx_bytes_sec, net_tx_bytes_sec, disk_io_reads, disk_io_writes)
VALUES ('$HOSTNAME', '$SERVICE_NAME', $JVM_PID, $JVM_THREADS, $JVM_HEAP_MB, $LOAD_AVG, $CPU_USAGE, $MEM_USAGE, $DISK_USAGE, $NET_RX, $NET_TX, $DISK_READS, $DISK_WRITES);
EOF
END_WRITE=$(get_now)
DB_WRITE_TIME=$(awk "BEGIN {printf \"%.4f\", $END_WRITE - $START_WRITE}")

START_READ=$(get_now)
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT id FROM machine_health WHERE hostname='$HOSTNAME' ORDER BY id DESC LIMIT 1;" > /dev/null 2>&1
END_READ=$(get_now)
DB_READ_TIME=$(awk "BEGIN {printf \"%.4f\", $END_READ - $START_READ}")

# --- 4. LOG TO STANDARD OUTPUT ---
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
echo "[${TIMESTAMP}] Host: ${HOSTNAME} | Service: ${SERVICE_NAME}"
echo "  ↳ Load Avg (1m): ${LOAD_AVG} | CPU: ${CPU_USAGE}% | Mem: ${MEM_USAGE}%"
echo "  ↳ Disk Space:    ${DISK_USAGE}%"
echo "  ↳ Network (${INTERFACE}): RX: ${NET_RX} B/s | TX: ${NET_TX} B/s"
echo "  ☕ JVM Stats:    PID: ${JVM_PID} | Active Threads: ${JVM_THREADS} | Heap Used: ${JVM_HEAP_MB} MB"
echo "  ⚡ DB Latency:   Connect: ${DB_CONNECT_TIME}s | Write: ${DB_WRITE_TIME}s | Read: ${DB_READ_TIME}s"
echo "--------------------------------------------------------"

# --- 5. BACKFILL THE BENCHMARK LATENCIES ---
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF > /dev/null 2>&1
UPDATE machine_health 
SET db_connect_sec = $DB_CONNECT_TIME, db_write_sec = $DB_WRITE_TIME, db_read_sec = $DB_READ_TIME 
WHERE hostname = '$HOSTNAME' 
ORDER BY id DESC LIMIT 1;
EOF
