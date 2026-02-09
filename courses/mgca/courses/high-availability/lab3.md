# High Availability Module - L3 Lab: Advanced HA Configuration and Optimization

## Lab Overview

In this L3 (Advanced Level) lab, you will practice advanced high availability (HA) configuration and optimization techniques in GaussDB, including:
- Multi-node cluster configuration
- Synchronous replication optimization
- Automatic failover mechanisms
- Load balancing with connection pooling
- Cross-region HA setup

**Time Required**: 60 minutes
**Prerequisites**: Completed L1 and L2 HA Labs, multiple database instances available

## Learning Objectives

By completing this lab, you will be able to:
- Configure multi-node HA clusters
- Optimize synchronous replication settings
- Implement automatic failover
- Set up load balancing for HA clusters
- Design cross-region disaster recovery solutions

## Lab Tasks

### Task 1: Multi-Node Cluster Setup

Configure a multi-node primary-standby cluster.

**Check current replication setup**:
```sql
SELECT 
    application_name,
    client_addr,
    state,
    sync_state,
    replay_lag,
    flush_lag
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -c "SELECT application_name, client_addr, state, sync_state, replay_lag, flush_lag FROM pg_stat_replication;"]]{{RUN}}

**Configure synchronous replication**:
```sql
-- Check current synchronous mode
SHOW synchronous_commit;
SHOW synchronous_standby_names;

-- Configure for synchronous replication
ALTER SYSTEM SET synchronous_commit = 'on';
ALTER SYSTEM SET synchronous_standby_names = 'standby1,standby2';

-- Reload configuration
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -c "SHOW synchronous_commit; SHOW synchronous_standby_names; ALTER SYSTEM SET synchronous_commit = 'on'; ALTER SYSTEM SET synchronous_standby_names = 'standby1,standby2'; SELECT pg_reload_conf();"]]{{RUN}}

**Monitor replication health**:
```sql
SELECT 
    application_name,
    state,
    sync_state,
    CASE 
        WHEN sync_state = 'sync' THEN 'Synchronous'
        WHEN sync_state = 'potential' THEN 'Potential Sync'
        ELSE 'Asynchronous'
    END AS replication_mode,
    replay_lag / 1000 AS replay_lag_seconds
FROM pg_stat_replication
ORDER BY replay_lag;
```

[[gsql -d postgres -p 5432 -c "SELECT application_name, state, sync_state, CASE WHEN sync_state = 'sync' THEN 'Synchronous' WHEN sync_state = 'potential' THEN 'Potential Sync' ELSE 'Asynchronous' END AS replication_mode, replay_lag / 1000 AS replay_lag_seconds FROM pg_stat_replication ORDER BY replay_lag;"]]{{RUN}}

**Create replication monitoring view**:
```sql
CREATE OR REPLACE VIEW replication_health AS
SELECT 
    now() AS check_time,
    application_name,
    state,
    sync_state,
    replay_lag AS lag_bytes,
    replay_lag / (1024 * 1024) AS lag_mb,
    replay_lag / 1000 AS lag_seconds,
    pg_size_pretty(replay_lag) AS lag_readable,
    sent_lag,
    flush_lag
FROM pg_stat_replication;

-- Monitor replication health
SELECT * FROM replication_health;
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE VIEW replication_health AS SELECT now() AS check_time, application_name, state, sync_state, replay_lag AS lag_bytes, replay_lag / (1024 * 1024) AS lag_mb, replay_lag / 1000 AS lag_seconds, pg_size_pretty(replay_lag) AS lag_readable, sent_lag, flush_lag FROM pg_stat_replication; SELECT * FROM replication_health;"]]{{RUN}}

**What to observe**:
- Synchronous replication ensures data durability
- Lag should be minimal for synchronous standbys
- Multiple standbys can be prioritized

---

### Task 2: Replication Performance Tuning

Optimize replication settings for high throughput.

**Check replication parameters**:
```sql
SHOW wal_sender_timeout;
SHOW wal_receiver_status_interval;
SHOW hot_standby_feedback;
SHOW max_wal_senders;
SHOW max_replication_slots;
```

[[gsql -d postgres -p 5432 -c "SHOW wal_sender_timeout; SHOW wal_receiver_status_interval; SHOW hot_standby_feedback; SHOW max_wal_senders; SHOW max_replication_slots;"]]{{RUN}}

**Generate high-throughput workload**:
```sql
\c postgres

CREATE TABLE perf_test_replication (
    id INT,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- High-throughput insert test
INSERT INTO perf_test_replication
SELECT 
    generate_series(1, 100000),
    'High throughput test data ' || generate_series(1, 100000),
    CURRENT_TIMESTAMP;
```

[[gsql -d postgres -p 5432 -c "\\c postgres; CREATE TABLE perf_test_replication (id INT, data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO perf_test_replication SELECT generate_series(1, 100000), 'High throughput test data ' || generate_series(1, 100000), CURRENT_TIMESTAMP;"]]{{RUN}}

**Monitor replication during workload**:
```sql
-- Check replication lag
SELECT 
    application_name,
    state,
    replay_lag / 1000 AS lag_seconds,
    sent_lag / 1000 AS sent_lag_seconds,
    flush_lag / 1000 AS flush_lag_seconds
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -c "SELECT application_name, state, replay_lag / 1000 AS lag_seconds, sent_lag / 1000 AS sent_lag_seconds, flush_lag / 1000 AS flush_lag_seconds FROM pg_stat_replication;"]]{{RUN}}

**Optimize replication settings**:
```sql
-- Increase WAL sender timeout for slower networks
ALTER SYSTEM SET wal_sender_timeout = '60s';

-- Reduce status interval for faster detection
ALTER SYSTEM SET wal_receiver_status_interval = '5s';

-- Enable hot standby feedback
ALTER SYSTEM SET hot_standby_feedback = 'on';

-- Increase max WAL senders if needed
ALTER SYSTEM SET max_wal_senders = 10;

-- Reload configuration
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET wal_sender_timeout = '60s'; ALTER SYSTEM SET wal_receiver_status_interval = '5s'; ALTER SYSTEM SET hot_standby_feedback = 'on'; ALTER SYSTEM SET max_wal_senders = 10; SELECT pg_reload_conf();"]]{{RUN}}

**Monitor WAL activity**:
```sql
SELECT 
    pg_current_wal_lsn() AS current_lsn,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) AS total_wal_size;
```

[[gsql -d postgres -p 5432 -c "SELECT pg_current_wal_lsn() AS current_lsn, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) AS total_wal_size;"]]{{RUN}}

**What to observe**:
- Replication lag increases with high throughput
- Optimized settings improve replication performance
- WAL growth reflects write activity

---

### Task 3: Automatic Failover Configuration

Set up automated failover with monitoring tools.

**Create failover monitoring script**:
```bash
cat > /tmp/monitor_failover.sh <<'SCRIPT'
#!/bin/bash

PRIMARY_HOST="localhost"
STANDBY_HOST="standby.example.com"
PORT=5432
USER="postgres"
DATABASE="postgres"

# Check primary health
PRIMARY_STATUS=$(psql -h ${PRIMARY_HOST} -p ${PORT} -U ${USER} -d ${DATABASE} -t -c "SELECT 1" 2>&1)

if [ $? -ne 0 ]; then
    echo "$(date): Primary is down! Status: ${PRIMARY_STATUS}"
    
    # Check if standby is healthy
    STANDBY_STATUS=$(psql -h ${STANDBY_HOST} -p ${PORT} -U ${USER} -d ${DATABASE} -t -c "SELECT pg_is_in_recovery()" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "$(date): Standby is healthy. Initiating failover..."
        
        # Promote standby to primary
        psql -h ${STANDBY_HOST} -p ${PORT} -U ${USER} -d ${DATABASE} -c "SELECT pg_promote()"
        
        echo "$(date): Failover completed. Standby promoted to primary."
    else
        echo "$(date): Standby is also down. Manual intervention required!"
    fi
else
    echo "$(date): Primary is healthy."
fi
SCRIPT

chmod +x /tmp/monitor_failover.sh
```

[[bash -c "cat > /tmp/monitor_failover.sh <<'SCRIPT'
#!/bin/bash
PRIMARY_HOST=\"localhost\"
STANDBY_HOST=\"standby.example.com\"
PORT=5432
USER=\"postgres\"
DATABASE=\"postgres\"
PRIMARY_STATUS=\$(psql -h \${PRIMARY_HOST} -p \${PORT} -U \${USER} -d \${DATABASE} -t -c \"SELECT 1\" 2>&1)
if [ \$? -ne 0 ]; then
    echo \"\$(date): Primary is down! Status: \${PRIMARY_STATUS}\"
    STANDBY_STATUS=\$(psql -h \${STANDBY_HOST} -p \${PORT} -U \${USER} -d \${DATABASE} -t -c \"SELECT pg_is_in_recovery()\" 2>&1)
    if [ \$? -eq 0 ]; then
        echo \"\$(date): Standby is healthy. Initiating failover...\"
        psql -h \${STANDBY_HOST} -p \${PORT} -U \${USER} -d \${DATABASE} -c \"SELECT pg_promote()\"
        echo \"\$(date): Failover completed. Standby promoted to primary.\"
    else
        echo \"\$(date): Standby is also down. Manual intervention required!\"
    fi
else
    echo \"\$(date): Primary is healthy.\"
fi
SCRIPT
chmod +x /tmp/monitor_failover.sh"]]{{RUN}}

**Create replication slot management**:
```sql
-- Create physical replication slot for failover
SELECT pg_create_physical_replication_slot('failover_slot');

-- List replication slots
SELECT 
    slot_name,
    slot_type,
    active,
    restart_lsn,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag
FROM pg_replication_slots;
```

[[gsql -d postgres -p 5432 -c "SELECT pg_create_physical_replication_slot('failover_slot'); SELECT slot_name, slot_type, active, restart_lsn, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag FROM pg_replication_slots;"]]{{RUN}}

**Configure switchover procedures**:
```bash
cat > /tmp/planned_switchover.sh <<'SCRIPT'
#!/bin/bash

echo "Planned Switchover Procedure:"
echo "1. Stop writes to primary"
echo "2. Ensure all WAL is replicated"
echo "3. Stop primary"
echo "4. Promote standby to primary"
echo "5. Reconfigure old primary as standby"
echo "6. Verify replication"
echo ""
echo "Commands to execute:"
echo "Step 1: SELECT pg_is_in_recovery(); -- Verify primary role"
echo "Step 2: CHECKPOINT; -- Ensure all data flushed"
echo "Step 3: -- Stop primary process"
echo "Step 4: SELECT pg_promote(); -- On standby"
echo "Step 5: -- Reconfigure old primary"
echo "Step 6: SELECT * FROM pg_stat_replication; -- Verify"
SCRIPT

chmod +x /tmp/planned_switchover.sh
cat /tmp/planned_switchover.sh
```

[[bash -c "cat > /tmp/planned_switchover.sh <<'SCRIPT'
#!/bin/bash
echo \"Planned Switchover Procedure:\"
echo \"1. Stop writes to primary\"
echo \"2. Ensure all WAL is replicated\"
echo \"3. Stop primary\"
echo \"4. Promote standby to primary\"
echo \"5. Reconfigure old primary as standby\"
echo \"6. Verify replication\"
echo \"\"
echo \"Commands to execute:\"
echo \"Step 1: SELECT pg_is_in_recovery(); -- Verify primary role\"
echo \"Step 2: CHECKPOINT; -- Ensure all data flushed\"
echo \"Step 3: -- Stop primary process\"
echo \"Step 4: SELECT pg_promote(); -- On standby\"
echo \"Step 5: -- Reconfigure old primary\"
echo \"Step 6: SELECT * FROM pg_stat_replication; -- Verify\"
SCRIPT
chmod +x /tmp/planned_switchover.sh && cat /tmp/planned_switchover.sh"]]{{RUN}}

**What to observe**:
- Failover requires coordination
- Replication slots prevent WAL loss
- Planned switchover is safer than unplanned failover

---

### Task 4: Load Balancing with Connection Pooling

Set up connection pooler for HA cluster load distribution.

**Create load balancer configuration**:
```bash
cat > /tmp/pgbouncer.conf <<'CONFIG'
[databases]
postgres = host=localhost port=5432

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /tmp/users.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
reserve_pool_size = 10
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
server_connect_timeout = 15
query_timeout = 30
CONFIG

cat /tmp/pgbouncer.conf
```

[[bash -c "cat > /tmp/pgbouncer.conf <<'CONFIG'
[databases]
postgres = host=localhost port=5432
[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /tmp/users.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
reserve_pool_size = 10
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
server_connect_timeout = 15
query_timeout = 30
CONFIG
cat /tmp/pgbouncer.conf"]]{{RUN}}

**Create multi-backend configuration**:
```bash
cat > /tmp/pgbouncer_ha.conf <<'CONFIG'
[databases]
# Round-robin load balancing
postgres = host=primary.example.com port=5432
         host=standby1.example.com port=5432
         host=standby2.example.com port=5432

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
CONFIG

cat /tmp/pgbouncer_ha.conf
```

[[bash -c "cat > /tmp/pgbouncer_ha.conf <<'CONFIG'
[databases]
postgres = host=primary.example.com port=5432 host=standby1.example.com port=5432 host=standby2.example.com port=5432
[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
CONFIG
cat /tmp/pgbouncer_ha.conf"]]{{RUN}}

**Create monitoring dashboard**:
```bash
cat > /tmp/monitor_pool.sh <<'SCRIPT'
#!/bin/bash

echo "=== Connection Pool Monitoring ==="
echo ""
echo "Pool Statistics:"
echo "  Total connections: $(psql -h localhost -p 6432 -t -c "SHOW stats;" | grep total)"
echo "  Active connections: $(psql -h localhost -p 6432 -t -c "SHOW stats;" | grep active)"
echo "  Waiting: $(psql -h localhost -p 6432 -t -c "SHOW stats;" | grep waiting)"
echo ""
echo "Pool Lists:"
psql -h localhost -p 6432 -c "SHOW pools;"
echo ""
echo "Server Status:"
psql -h localhost -p 6432 -c "SHOW servers;"
SCRIPT

chmod +x /tmp/monitor_pool.sh
cat /tmp/monitor_pool.sh
```

[[bash -c "cat > /tmp/monitor_pool.sh <<'SCRIPT'
#!/bin/bash
echo \"=== Connection Pool Monitoring ===\"
echo \"\"
echo \"Pool Statistics:\"
echo \"  Total connections: \$(psql -h localhost -p 6432 -t -c \"SHOW stats;\" | grep total)\"
echo \"  Active connections: \$(psql -h localhost -p 6432 -t -c \"SHOW stats;\" | grep active)\"
echo \"  Waiting: \$(psql -h localhost -p 6432 -t -c \"SHOW stats;\" | grep waiting)\"
echo \"\"
echo \"Pool Lists:\"
psql -h localhost -p 6432 -c \"SHOW pools;\"
echo \"\"
echo \"Server Status:\"
psql -h localhost -p 6432 -c \"SHOW servers;\"
SCRIPT
chmod +x /tmp/monitor_pool.sh && cat /tmp/monitor_pool.sh"]]{{RUN}}

**What to observe**:
- Connection pooling reduces connection overhead
- Load balancing distributes traffic
- Monitoring ensures pool health

---

### Task 5: Cross-Region HA Setup

Design cross-region disaster recovery solution.

**Create cross-region architecture diagram**:
```bash
cat > /tmp/cross_region_design.txt <<'DESIGN'
Cross-Region HA Architecture:

Region A (Primary):
  - Primary Database (active)
  - Local Standby 1 (sync)
  - Load Balancer A
  - Backup Storage

Region B (DR):
  - Primary Standby (async, local primary after failover)
  - Standby 2 (async)
  - Load Balancer B
  - Backup Storage

Replication Flow:
  Primary A → Standby 1 (sync)
  Primary A → Standby B (async)
  Standby B → Standby 2 (async)

Failover Scenarios:
  1. Primary A down → Promote Standby 1 (Region A)
  2. Region A down → Promote Standby B (Region B)
  3. Network partition → Manual decision point

Recovery Time Objectives:
  - RPO: < 5 seconds (sync), < 1 minute (async)
  - RTO: < 30 seconds (auto failover), < 5 minutes (manual)
DESIGN

cat /tmp/cross_region_design.txt
```

[[bash -c "cat > /tmp/cross_region_design.txt <<'DESIGN'
Cross-Region HA Architecture:
Region A (Primary):
  - Primary Database (active)
  - Local Standby 1 (sync)
  - Load Balancer A
  - Backup Storage
Region B (DR):
  - Primary Standby (async, local primary after failover)
  - Standby 2 (async)
  - Load Balancer B
  - Backup Storage
Replication Flow:
  Primary A → Standby 1 (sync)
  Primary A → Standby B (async)
  Standby B → Standby 2 (async)
Failover Scenarios:
  1. Primary A down → Promote Standby 1 (Region A)
  2. Region A down → Promote Standby B (Region B)
  3. Network partition → Manual decision point
Recovery Time Objectives:
  - RPO: < 5 seconds (sync), < 1 minute (async)
  - RTO: < 30 seconds (auto failover), < 5 minutes (manual)
DESIGN
cat /tmp/cross_region_design.txt"]]{{RUN}}

**Configure cascading replication**:
```sql
-- On primary: Configure multiple standbys
ALTER SYSTEM SET synchronous_standby_names = 'standby1';
SELECT pg_reload_conf();

-- Verify cascading setup
SELECT 
    application_name,
    client_addr,
    state,
    sync_state
FROM pg_stat_replication
WHERE application_name LIKE '%standby%';
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET synchronous_standby_names = 'standby1'; SELECT pg_reload_conf(); SELECT application_name, client_addr, state, sync_state FROM pg_stat_replication WHERE application_name LIKE '%standby%';"]]{{RUN}}

**Create cross-region monitoring script**:
```bash
cat > /tmp/monitor_cross_region.sh <<'SCRIPT'
#!/bin/bash

echo "=== Cross-Region HA Monitoring ==="
echo ""

# Check Region A (Primary)
echo "Region A (Primary):"
psql -h primary-a.example.com -p 5432 -t -c "SELECT 'Primary' AS role, pg_current_wal_lsn() AS lsn, pg_is_in_recovery() AS recovery" 2>/dev/null || echo "Region A: DOWN"

# Check Region B (DR)
echo ""
echo "Region B (DR):"
psql -h primary-b.example.com -p 5432 -t -c "SELECT 'DR' AS role, pg_current_wal_lsn() AS lsn, pg_is_in_recovery() AS recovery" 2>/dev/null || echo "Region B: DOWN"

# Check replication lag
echo ""
echo "Replication Lag:"
psql -h primary-a.example.com -p 5432 -c "
SELECT 
    application_name,
    state,
    sync_state,
    replay_lag / 1000 AS lag_seconds
FROM pg_stat_replication
ORDER BY replay_lag;
" 2>/dev/null
SCRIPT

chmod +x /tmp/monitor_cross_region.sh
cat /tmp/monitor_cross_region.sh
```

[[bash -c "cat > /tmp/monitor_cross_region.sh <<'SCRIPT'
#!/bin/bash
echo \"=== Cross-Region HA Monitoring ===\"
echo \"\"
echo \"Region A (Primary):\"
psql -h primary-a.example.com -p 5432 -t -c \"SELECT 'Primary' AS role, pg_current_wal_lsn() AS lsn, pg_is_in_recovery() AS recovery\" 2>/dev/null || echo \"Region A: DOWN\"
echo \"\"
echo \"Region B (DR):\"
psql -h primary-b.example.com -p 5432 -t -c \"SELECT 'DR' AS role, pg_current_wal_lsn() AS lsn, pg_is_in_recovery() AS recovery\" 2>/dev/null || echo \"Region B: DOWN\"
echo \"\"
echo \"Replication Lag:\"
psql -h primary-a.example.com -p 5432 -c \"SELECT application_name, state, sync_state, replay_lag / 1000 AS lag_seconds FROM pg_stat_replication ORDER BY replay_lag;\" 2>/dev/null
SCRIPT
chmod +x /tmp/monitor_cross_region.sh && cat /tmp/monitor_cross_region.sh"]]{{RUN}}

**What to observe**:
- Cross-region HA provides geographic redundancy
- Cascading replication reduces primary load
- Multi-region monitoring is essential

---

### Task 6: HA Cluster Health Monitoring

Implement comprehensive monitoring for HA cluster.

**Create HA health dashboard**:
```sql
CREATE OR REPLACE VIEW ha_cluster_health AS
SELECT 
    now() AS check_time,
    (SELECT pg_is_in_recovery()) AS is_recovery,
    (SELECT pg_current_wal_lsn()) AS current_lsn,
    (SELECT COUNT(*) FROM pg_stat_replication) AS standby_count,
    (SELECT COUNT(*) FROM pg_stat_replication WHERE sync_state = 'sync') AS sync_standby_count,
    (SELECT COUNT(*) FROM pg_stat_replication WHERE state = 'streaming') AS streaming_count,
    (SELECT AVG(replay_lag) FROM pg_stat_replication) AS avg_replay_lag,
    (SELECT MAX(replay_lag) FROM pg_stat_replication) AS max_replay_lag;

SELECT * FROM ha_cluster_health;
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE VIEW ha_cluster_health AS SELECT now() AS check_time, (SELECT pg_is_in_recovery()) AS is_recovery, (SELECT pg_current_wal_lsn()) AS current_lsn, (SELECT COUNT(*) FROM pg_stat_replication) AS standby_count, (SELECT COUNT(*) FROM pg_stat_replication WHERE sync_state = 'sync') AS sync_standby_count, (SELECT COUNT(*) FROM pg_stat_replication WHERE state = 'streaming') AS streaming_count, (SELECT AVG(replay_lag) FROM pg_stat_replication) AS avg_replay_lag, (SELECT MAX(replay_lag) FROM pg_stat_replication) AS max_replay_lag; SELECT * FROM ha_cluster_health;"]]{{RUN}}

**Create alert thresholds**:
```sql
CREATE TABLE ha_alert_thresholds (
    metric_name VARCHAR(50) PRIMARY KEY,
    warning_value NUMERIC,
    critical_value NUMERIC,
    unit VARCHAR(20)
);

INSERT INTO ha_alert_thresholds VALUES
('replication_lag_ms', 5000, 30000, 'milliseconds'),
('standby_count', 1, 0, 'count'),
('sync_standby_count', 0, 0, 'count'),
('connection_pool_active', 80, 95, 'percent');

SELECT * FROM ha_alert_thresholds;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE ha_alert_thresholds (metric_name VARCHAR(50) PRIMARY KEY, warning_value NUMERIC, critical_value NUMERIC, unit VARCHAR(20)); INSERT INTO ha_alert_thresholds VALUES ('replication_lag_ms', 5000, 30000, 'milliseconds'), ('standby_count', 1, 0, 'count'), ('sync_standby_count', 0, 0, 'count'), ('connection_pool_active', 80, 95, 'percent'); SELECT * FROM ha_alert_thresholds;"]]{{RUN}}

**Create alert checking function**:
```sql
CREATE OR REPLACE FUNCTION check_ha_alerts()
RETURNS TABLE (
    metric VARCHAR(50),
    current_value NUMERIC,
    threshold_level VARCHAR(10),
    threshold_value NUMERIC,
    unit VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'replication_lag_ms'::VARCHAR(50),
        COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0)::NUMERIC,
        CASE 
            WHEN COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0) > (SELECT critical_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms')
            THEN 'CRITICAL'
            WHEN COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0) > (SELECT warning_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms')
            THEN 'WARNING'
            ELSE 'OK'
        END,
        CASE 
            WHEN COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0) > (SELECT critical_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms')
                THEN (SELECT critical_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms')
            WHEN COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0) > (SELECT warning_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms')
                THEN (SELECT warning_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms')
            ELSE 0
        END,
        (SELECT unit FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms');
END;
$$ LANGUAGE plpgsql;

SELECT * FROM check_ha_alerts();
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE FUNCTION check_ha_alerts() RETURNS TABLE (metric VARCHAR(50), current_value NUMERIC, threshold_level VARCHAR(10), threshold_value NUMERIC, unit VARCHAR(20)) AS \$\$ BEGIN RETURN QUERY SELECT 'replication_lag_ms'::VARCHAR(50), COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0)::NUMERIC, CASE WHEN COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0) > (SELECT critical_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms') THEN 'CRITICAL' WHEN COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0) > (SELECT warning_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms') THEN 'WARNING' ELSE 'OK' END, CASE WHEN COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0) > (SELECT critical_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms') THEN (SELECT critical_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms') WHEN COALESCE((SELECT AVG(replay_lag) FROM pg_stat_replication), 0) > (SELECT warning_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms') THEN (SELECT warning_value FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms') ELSE 0 END, (SELECT unit FROM ha_alert_thresholds WHERE metric_name = 'replication_lag_ms'); END; \$\$ LANGUAGE plpgsql; SELECT * FROM check_ha_alerts();"]]{{RUN}}

**What to observe**:
- Comprehensive monitoring provides cluster visibility
- Alert thresholds enable proactive response
- Automated checking reduces manual effort

---

### Task 7: Clean Up Test Environment

**Drop test tables and views**:
```sql
DROP TABLE perf_test_replication IF EXISTS;
DROP VIEW replication_health IF EXISTS;
DROP VIEW ha_cluster_health IF EXISTS;
DROP TABLE ha_alert_thresholds IF EXISTS;
DROP FUNCTION check_ha_alerts() IF EXISTS;
DROP TABLE large_table IF EXISTS;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE perf_test_replication IF EXISTS; DROP VIEW replication_health IF EXISTS; DROP VIEW ha_cluster_health IF EXISTS; DROP TABLE ha_alert_thresholds IF EXISTS; DROP FUNCTION check_ha_alerts() IF EXISTS; DROP TABLE large_table IF EXISTS;"]]{{RUN}}

**Clean up scripts**:
```bash
rm -f /tmp/monitor_failover.sh
rm -f /tmp/planned_switchover.sh
rm -f /tmp/pgbouncer.conf /tmp/pgbouncer_ha.conf
rm -f /tmp/monitor_pool.sh
rm -f /tmp/cross_region_design.txt
rm -f /tmp/monitor_cross_region.sh
```

[[bash -c "rm -f /tmp/monitor_failover.sh /tmp/planned_switchover.sh /tmp/pgbouncer.conf /tmp/pgbouncer_ha.conf /tmp/monitor_pool.sh /tmp/cross_region_design.txt /tmp/monitor_cross_region.sh"]]{{RUN}}

**Verify cleanup**:
```bash
echo "Test files removed:"
ls -la /tmp/*.sh /tmp/*.conf /tmp/*.txt 2>/dev/null || echo "No test files found"
```

[[bash -c "echo \"Test files removed:\" && ls -la /tmp/*.sh /tmp/*.conf /tmp/*.txt 2>/dev/null || echo \"No test files found\""]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Configured multi-node cluster setup
- [ ] Task 2: Optimized replication performance
- [ ] Task 3: Implemented automatic failover
- [ ] Task 4: Set up load balancing with connection pooling
- [ ] Task 5: Designed cross-region HA architecture
- [ ] Task 6: Implemented comprehensive HA monitoring
- [ ] Task 7: Cleaned up test environment

## Review Questions

1. **What is advantage of synchronous replication?**
   - [ ] Better performance
   - [ ] Zero data loss guarantee
   - [ ] Lower network latency
   - [ ] Easier configuration

2. **When should automatic failover be used?**
   - [ ] During maintenance windows
   - [ ] For unplanned primary failures
   - [ ] For planned upgrades
   - [ ] For data migration

3. **What does connection pooling do?**
   - [ ] Compresses data
   - [ ] Reuses database connections
   - [ ] Caches query results
   - [ ] Encrypts traffic

4. **What is benefit of cross-region HA?**
   - [ ] Faster queries
   - [ ] Geographic disaster protection
   - [ ] Lower cost
   - [ ] Simpler setup

## Summary

In this L3 lab, you practiced:
- **Multi-Node Clusters**: Synchronous replication configuration
- **Replication Tuning**: Optimizing WAL and replication settings
- **Automatic Failover**: Monitoring and failover automation
- **Load Balancing**: Connection pooling for traffic distribution
- **Cross-Region HA**: Geographic disaster recovery design
- **Comprehensive Monitoring**: Health dashboards and alerting

These advanced HA techniques ensure high availability and disaster recovery capabilities for production GaussDB deployments.

## Next Steps

Proceed to **L4 Lab** to practice expert-level operations including:
- Complex failover scenarios
- Multi-region performance optimization
- Advanced monitoring and alerting
- HA scaling strategies
- Production incident management
