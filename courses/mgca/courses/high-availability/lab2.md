# High Availability Module - L2 Lab: Primary-Standby Configuration

## Lab Overview

In this L2 (Intermediate Level) lab, you will practice configuring a primary-standby GaussDB setup, including:
- Configuring synchronous replication
- Performing manual failover
- Setting up monitoring and alerting
- Understanding switchover procedures

**Time Required**: 40 minutes
**Prerequisites**: Completed L1 HA Lab, two GaussDB instances (primary + standby)

## Learning Objectives

By completing this lab, you will be able to:
- Configure synchronous replication for data safety
- Perform manual failover during primary failure
- Set up health monitoring and alerting
- Execute planned switchover for maintenance

## Lab Tasks

### Task 1: Configure Synchronous Replication

Let's upgrade the primary-standby setup to use synchronous replication.

**Check current replication mode** (on primary):
```sql
SHOW synchronous_commit;
SHOW synchronous_standby_names;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SHOW synchronous_commit;"]]{{RUN}}
[[gsql -d postgres -p 5432 -h <primary_ip> -c "SHOW synchronous_standby_names;"]]{{RUN}}

**Configure synchronous standby** (on primary):
```sql
-- Set synchronous commit for data safety
ALTER SYSTEM SET synchronous_commit = 'on';

-- Define which standbys are synchronous
ALTER SYSTEM SET synchronous_standby_names = 'standby1';

-- Reload configuration
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "ALTER SYSTEM SET synchronous_commit = 'on';"]]{{RUN}}
[[gsql -d postgres -p 5432 -h <primary_ip> -c "ALTER SYSTEM SET synchronous_standby_names = 'standby1';"]]{{RUN}}
[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT pg_reload_conf();"]]{{RUN}}

**What to observe**:
- **synchronous_commit = 'on'**: Waits for standby confirmation before commit
- **synchronous_standby_names**: Lists standby names that must be synchronous
- 'standby1' must match the application_name used in primary_conn_info

**Verify synchronous replication**:
```sql
SELECT 
    application_name,
    sync_state,
    sync_priority,
    state
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT application_name, sync_state, sync_priority, state FROM pg_stat_replication;"]]{{RUN}}

**Expected**: sync_state should show 'sync' for standby1

---

### Task 2: Monitor Replication Health

Let's set up comprehensive monitoring for replication health.

**Create replication monitoring function** (on primary):
```sql
CREATE OR REPLACE FUNCTION check_replication_health()
RETURNS TABLE (
    standby_name TEXT,
    state TEXT,
    sync_state TEXT,
    lag_seconds NUMERIC,
    bytes_behind BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        application_name AS standby_name,
        state,
        sync_state,
        round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds,
        pg_wal_lsn_diff(sent_lsn, replay_lsn) AS bytes_behind
    FROM pg_stat_replication;
END;
$$ LANGUAGE plpgsql;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "CREATE OR REPLACE FUNCTION check_replication_health() RETURNS TABLE (standby_name TEXT, state TEXT, sync_state TEXT, lag_seconds NUMERIC, bytes_behind BIGINT) AS $$ BEGIN RETURN QUERY SELECT application_name AS standby_name, state, sync_state, round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds, pg_wal_lsn_diff(sent_lsn, replay_lsn) AS bytes_behind FROM pg_stat_replication; END; $$ LANGUAGE plpgsql;"]]{{RUN}}

**Query replication health**:
```sql
SELECT * FROM check_replication_health();
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT * FROM check_replication_health();"]]{{RUN}}

**Create alert conditions**:
```sql
-- Find standbys with excessive lag
SELECT 
    standby_name,
    lag_seconds,
    CASE 
        WHEN lag_seconds > 30 THEN 'CRITICAL'
        WHEN lag_seconds > 10 THEN 'WARNING'
        ELSE 'OK'
    END AS health_status
FROM check_replication_health()
WHERE lag_seconds > 5;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT standby_name, lag_seconds, CASE WHEN lag_seconds > 30 THEN 'CRITICAL' WHEN lag_seconds > 10 THEN 'WARNING' ELSE 'OK' END AS health_status FROM check_replication_health() WHERE lag_seconds > 5;"]]{{RUN}}

---

### Task 3: Test Synchronous Replication

Let's verify synchronous replication is working correctly.

**Insert test data on primary**:
```sql
CREATE TABLE sync_test (
    id INT PRIMARY KEY,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data synchronously
INSERT INTO sync_test (id, data)
SELECT generate_series(1, 100),
    'Sync test ' || generate_series(1, 100)
FROM generate_series(1, 100);
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "CREATE TABLE sync_test (id INT PRIMARY KEY, data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO sync_test (id, data) SELECT generate_series(1, 100), 'Sync test ' || generate_series(1, 100) FROM generate_series(1, 100);"]]{{RUN}}

**Measure time to propagate**:
```bash
# Get current time
START_TIME=$(date +%s)

# Insert on primary
gsql -h <primary_ip> -p 5432 -d postgres -c "INSERT INTO sync_test (id, data) VALUES (101, 'Latency test');"

# Wait a moment, then check standby
sleep 2

# Check if data exists on standby
gsql -h <standby_ip> -p 5433 -d postgres -c "SELECT count(*) FROM sync_test WHERE id = 101;"

END_TIME=$(date +%s)
echo "Propagation time: $((END_TIME - START_TIME)) seconds"
```

[[date +%s | tee /tmp/start_time.txt]]{{RUN}}
[[sleep 2]]{{RUN}}
[[date +%s | tee /tmp/end_time.txt]]{{RUN}}

**Check replication lag during synchronous mode**:
```sql
SELECT 
    application_name,
    sync_state,
    replay_lag,
    round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT application_name, sync_state, replay_lag, round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds FROM pg_stat_replication;"]]{{RUN}}

**Expected**: lag should be very low (< 1 second) with synchronous replication

---

### Task 4: Perform Manual Failover

Let's practice manual failover when primary fails.

**Simulate primary failure** (stop primary):
```bash
# On primary server
gs_ctl stop -D /opt/huawei/install/data/db1 -m fast
```

[[gs_ctl stop -D /opt/huawei/install/data/db1 -m fast]]{{RUN}}

**Promote standby to primary**:
```bash
# On standby server
gs_ctl promote -D /opt/huawei/install/data/standby
```

[[gs_ctl promote -D /opt/huawei/install/data/standby]]{{RUN}}

**Verify promotion**:
```sql
-- On new primary (formerly standby)
SELECT pg_is_in_recovery() AS is_standby;
```

[[gsql -d postgres -p 5432 -h <standby_ip> -c "SELECT pg_is_in_recovery() AS is_standby;"]]{{RUN}}

**Expected**: false (now acting as primary)

**Test write operations**:
```sql
INSERT INTO sync_test (id, data)
VALUES (102, 'After failover');

SELECT count(*) AS total_records FROM sync_test;
```

[[gsql -d postgres -p 5432 -h <standby_ip> -c "INSERT INTO sync_test (id, data) VALUES (102, 'After failover');"]]{{RUN}}
[[gsql -d postgres -p 5432 -h <standby_ip> -c "SELECT count(*) AS total_records FROM sync_test;"]]{{RUN}}

**Expected**: Should see 102 records (including new insert after failover)

---

### Task 5: Rebuild Old Primary as Standby

Let's convert the old primary to a new standby.

**Stop old primary** (if still running):
```bash
gs_ctl stop -D /opt/huawei/install/data/db1
```

[[gs_ctl stop -D /opt/huawei/install/data/db1]]{{RUN}}

**Remove old data and rebuild from new primary**:
```bash
# On old primary server
rm -rf /opt/huawei/install/data/db1

# Perform base backup from new primary
gs_basebackup -h <new_primary_ip> -p 5432 -U replicator \
    -D /opt/huawei/install/data/db1 \
    -Fp -X stream -P
```

[[rm -rf /opt/huawei/install/data/db1]]{{RUN}}
[[gs_basebackup -h <new_primary_ip> -p 5432 -U replicator -D /opt/huawei/install/data/db1 -Fp -X stream -P]]{{RUN}}

**Configure as standby**:
```bash
# Create standby.signal
touch /opt/huawei/install/data/db1/standby.signal

# Create primary_conn_info
cat > /opt/huawei/install/data/db1/primary_conn_info << 'EOF'
host=<new_primary_ip> port=5432 user=replicator password=Replicate! application_name=standby2
EOF
```

[[touch /opt/huawei/install/data/db1/standby.signal]]{{RUN}}
[[cat > /opt/huawei/install/data/db1/primary_conn_info << 'EOF'
host=<new_primary_ip> port=5432 user=replicator password=Replicate! application_name=standby2
EOF]]{{RUN}}

**Start as standby**:
```bash
gs_ctl start -D /opt/huawei/install/data/db1
```

[[gs_ctl start -D /opt/huawei/install/data/db1]]{{RUN}}

**Verify replication from new primary**:
```sql
-- On new primary
SELECT 
    application_name,
    state,
    sync_state
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -h <new_primary_ip> -c "SELECT application_name, state, sync_state FROM pg_stat_replication;"]]{{RUN}}

---

### Task 6: Configure Multiple Standbys

Let's set up multiple standby databases for redundancy.

**Create second standby** (standby3):
```bash
# Perform base backup for second standby
gs_basebackup -h <new_primary_ip> -p 5432 -U replicator \
    -D /opt/huawei/install/data/standby3 \
    -Fp -X stream -P

# Configure as standby
touch /opt/huawei/install/data/standby3/standby.signal

cat > /opt/huawei/install/data/standby3/primary_conn_info << 'EOF'
host=<new_primary_ip> port=5432 user=replicator password=Replicate! application_name=standby3
EOF
```

[[gs_basebackup -h <new_primary_ip> -p 5432 -U replicator -D /opt/huawei/install/data/standby3 -Fp -X stream -P]]{{RUN}}
[[touch /opt/huawei/install/data/standby3/standby.signal]]{{RUN}}
[[cat > /opt/huawei/install/data/standby3/primary_conn_info << 'EOF'
host=<new_primary_ip> port=5432 user=replicator password=Replicate! application_name=standby3
EOF]]{{RUN}}

**Configure synchronous replication with two standbys** (on primary):
```sql
-- Update synchronous_standby_names to include both standbys
ALTER SYSTEM SET synchronous_standby_names = 'standby2,standby3';

-- For more flexibility, use ANY with number
-- ALTER SYSTEM SET synchronous_standby_names = 'ANY 1 (standby2,standby3)';
```

[[gsql -d postgres -p 5432 -h <new_primary_ip> -c "ALTER SYSTEM SET synchronous_standby_names = 'standby2,standby3';"]]{{RUN}}

**Reload configuration**:
```sql
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -h <new_primary_ip> -c "SELECT pg_reload_conf();"]]{{RUN}}

**Start second standby**:
```bash
gs_ctl start -D /opt/huawei/install/data/standby3
```

[[gs_ctl start -D /opt/huawei/install/data/standby3]]{{RUN}}

**Verify both standbys**:
```sql
SELECT 
    application_name,
    client_addr,
    state,
    sync_state
FROM pg_stat_replication
ORDER BY sync_priority;
```

[[gsql -d postgres -p 5432 -h <new_primary_ip> -c "SELECT application_name, client_addr, state, sync_state FROM pg_stat_replication ORDER BY sync_priority;"]]{{RUN}}

---

### Task 7: Perform Planned Switchover

Let's practice a planned switchover for maintenance.

**Step 1: Stop application writes to primary**:
```bash
# Stop application connections
# (This would be done by application team)
# Simulate by checking for active connections
gsql -h <primary_ip> -p 5432 -d postgres -c "SELECT count(*) AS active_connections FROM pg_stat_activity WHERE state = 'active';"
```

[[gsql -h <primary_ip> -p 5432 -d postgres -c "SELECT count(*) AS active_connections FROM pg_stat_activity WHERE state = 'active';"]]{{RUN}}

**Step 2: Ensure standby is caught up**:
```sql
SELECT 
    application_name,
    round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT application_name, round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds FROM pg_stat_replication;"]]{{RUN}}

**Expected**: lag_seconds should be < 1 before switchover

**Step 3: Stop primary gracefully**:
```bash
gs_ctl stop -D /opt/huawei/install/data/db1 -m fast
```

[[gs_ctl stop -D /opt/huawei/install/data/db1 -m fast]]{{RUN}}

**Step 4: Promote standby to primary**:
```bash
gs_ctl promote -D /opt/huawei/install/data/standby2
```

[[gs_ctl promote -D /opt/huawei/install/data/standby2]]{{RUN}}

**Step 5: Update application to connect to new primary**:
```bash
# Test connection to new primary
gsql -h <standby2_ip> -p 5432 -d postgres -c "SELECT current_database(), current_user;"
```

[[gsql -h <standby2_ip> -p 5432 -d postgres -c "SELECT current_database(), current_user;"]]{{RUN}}

**Step 6: Convert old primary to standby** (follow Task 5 procedure)

---

### Task 8: Set Up Monitoring Alerting

Let's configure automated monitoring for replication issues.

**Create monitoring script**:
```bash
cat > /home/omm/scripts/monitor_replication.sh << 'EOF'
#!/bin/bash
# Replication Monitoring Script

# Thresholds
LAG_WARNING=10
LAG_CRITICAL=30

# Check replication health
LAG=$(gsql -h localhost -p 5432 -U omm -d postgres -t -c \
    "SELECT round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) \
    FROM pg_stat_replication \
    WHERE sync_state = 'sync' \
    ORDER BY replay_lag DESC LIMIT 1;")

if [ -z "$LAG" ]; then
    echo "ERROR: No synchronous replication found"
    exit 1
fi

# Check thresholds
if (( $(echo "$LAG > $LAG_CRITICAL" | bc -l) )); then
    echo "CRITICAL: Replication lag is ${LAG} seconds"
    # Send alert (example: email or Slack)
    # echo "CRITICAL replication lag: ${LAG}s" | mail -s "DB Alert" admin@example.com
elif (( $(echo "$LAG > $LAG_WARNING" | bc -l) )); then
    echo "WARNING: Replication lag is ${LAG} seconds"
else
    echo "OK: Replication lag is ${LAG} seconds"
fi

exit 0
EOF

chmod +x /home/omm/scripts/monitor_replication.sh
```

[[cat > /home/omm/scripts/monitor_replication.sh << 'EOF'
#!/bin/bash
# Replication Monitoring Script

# Thresholds
LAG_WARNING=10
LAG_CRITICAL=30

# Check replication health
LAG=$(gsql -h localhost -p 5432 -U omm -d postgres -t -c \
    "SELECT round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) \
    FROM pg_stat_replication \
    WHERE sync_state = 'sync' \
    ORDER BY replay_lag DESC LIMIT 1;")

if [ -z "$LAG" ]; then
    echo "ERROR: No synchronous replication found"
    exit 1
fi

# Check thresholds
if (( $(echo "$LAG > $LAG_CRITICAL" | bc -l) )); then
    echo "CRITICAL: Replication lag is ${LAG} seconds"
    # Send alert (example: email or Slack)
    # echo "CRITICAL replication lag: ${LAG}s" | mail -s "DB Alert" admin@example.com
elif (( $(echo "$LAG > $LAG_WARNING" | bc -l) )); then
    echo "WARNING: Replication lag is ${LAG} seconds"
else
    echo "OK: Replication lag is ${LAG} seconds"
fi

exit 0
EOF]]{{RUN}}
[[chmod +x /home/omm/scripts/monitor_replication.sh]]{{RUN}}

**Test monitoring script**:
```bash
/home/omm/scripts/monitor_replication.sh
```

[[/home/omm/scripts/monitor_replication.sh]]{{RUN}}

**Schedule monitoring** (every 5 minutes):
```bash
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/omm/scripts/monitor_replication.sh >> /home/omm/scripts/monitor.log 2>&1") | crontab -
```

[[(crontab -l 2>/dev/null; echo "*/5 * * * * /home/omm/scripts/monitor_replication.sh >> /home/omm/scripts/monitor.log 2>&1") | crontab -]]{{RUN}}

---

### Task 9: Clean Up Test Data

Let's clean up the test objects created during this lab.

**Drop test tables** (on primary):
```sql
DROP TABLE sync_test;
DROP TABLE IF EXISTS ha_test;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE sync_test; DROP TABLE IF EXISTS ha_test;"]]{{RUN}}

**Remove monitoring cron job**:
```bash
crontab -l | grep -v "monitor_replication" | crontab -
```

[[crontab -l | grep -v "monitor_replication" | crontab -]]{{RUN}}

**Remove monitoring script**:
```bash
rm -f /home/omm/scripts/monitor_replication.sh
```

[[rm -f /home/omm/scripts/monitor_replication.sh]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Configured synchronous replication
- [ ] Task 2: Set up replication health monitoring
- [ ] Task 3: Tested synchronous replication latency
- [ ] Task 4: Performed manual failover
- [ ] Task 5: Rebuilt old primary as standby
- [ ] Task 6: Configured multiple standby databases
- [ ] Task 7: Performed planned switchover
- [ ] Task 8: Set up monitoring and alerting
- [ ] Task 9: Cleaned up test data

## Review Questions

1. **What does synchronous_commit = 'on' guarantee?**
   - [ ] Faster performance
   - [ ] Data is confirmed on standby before commit returns
   - [ ] Automatic failover
   - [ ] Better compression

2. **What is the difference between failover and switchover?**
   - [ ] No difference
   - [ ] Failover is unplanned, switchover is planned
   - [ ] Switchover is unplanned
   - [ ] Both require manual intervention

3. **What does ANY 2 (standby1,standby2) in synchronous_standby_names mean?**
   - [ ] All standbys must be synchronous
   - [ ] At least 2 of the listed standbys must be synchronous
   - [ ] Only standby1 must be synchronous
   - [ ] Failover occurs after 2 seconds

4. **What is a good replication lag threshold for alerts?**
   - [ ] 60 seconds for warning
   - [ ] 10 seconds for warning, 30 seconds for critical
   - [ ] 5 minutes for warning
   - [ ] 1 hour for critical

## Summary

In this L2 lab, you practiced:
- **Synchronous Replication**: Configuring data-safe synchronous replication
- **Health Monitoring**: Creating functions and scripts to monitor replication health
- **Failover**: Performing manual failover during primary failure
- **Standby Rebuild**: Converting failed primary back to standby
- **Multiple Standbys**: Setting up multiple standby databases
- **Switchover**: Executing planned role reversal for maintenance
- **Alerting**: Setting up automated monitoring with alert thresholds

These intermediate HA operations enable you to manage robust primary-standby configurations with monitoring and failover capabilities.

## Best Practices

1. **Test Regularly**: Practice failover and switchover procedures monthly
2. **Monitor Lag**: Set up alerts for replication lag > 10 seconds
3. **Document Procedures**: Have clear runbooks for failover and switchover
4. **Use Synchronous Mode**: For critical data, use synchronous replication
5. **Multiple Standbys**: Maintain at least 2 standbys for redundancy

## Next Steps

Proceed to **L3 Lab** to practice advanced operations including:
- Multi-node cluster configuration
- Cross-region disaster recovery
- Automatic failover with HAProxy or similar tools
- Load balancing across multiple nodes
