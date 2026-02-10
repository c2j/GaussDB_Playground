# High Availability Module - L1 Lab: Basic HA Concepts

## Lab Overview

In this L1 (Entry Level) lab, you will explore basic high availability concepts in GaussDB, including:
- Understanding HA architecture types
- Checking replication status
- Monitoring standby databases
- Basic failover operations

**Time Required**: 20 minutes
**Prerequisites**: GaussDB primary-standby setup with at least one standby database

## Learning Objectives

By completing this lab, you will be able to:
- Identify primary and standby database roles
- Check replication status between primary and standby
- Monitor lag between primary and standby
- Understand basic failover concepts

## Lab Tasks

### Task 1: Check Database Role and HA Status

Let's determine if the current database is a primary or standby.

**Check current database role**:
```sql
SELECT pg_is_in_recovery() AS is_standby;
```

[[gsql -d postgres -p 5432 -c "SELECT pg_is_in_recovery() AS is_standby;"]]{{RUN}}

**What to observe**:
- **false**: Database is in primary role (accepts writes)
- **true**: Database is in standby role (read-only, replicating from primary)

**Get detailed replication status**:
```sql
SELECT 
    usename AS replication_user,
    application_name,
    client_addr AS client_address,
    state,
    sync_state,
    sync_priority,
    replay_lag
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -c "SELECT usename AS replication_user, application_name, client_addr AS client_address, state, sync_state, sync_priority, replay_lag FROM pg_stat_replication;"]]{{RUN}}

**What to observe**:
- This query shows all standby connections to the primary
- **sync_state**: 'sync' for synchronous standby, 'async' for asynchronous
- **state**: Current replication state (streaming, catchup, etc.)

---

### Task 2: Monitor Replication Lag

Let's check how far behind the standby is from the primary.

**Check replication lag**:
```sql
SELECT 
    client_addr AS standby_address,
    state,
    sync_state,
    CASE 
        WHEN pg_is_in_recovery() = false THEN
            EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
        ELSE NULL
    END AS lag_seconds,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn)) AS sent_bytes,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS replay_bytes
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -c "SELECT client_addr AS standby_address, state, sync_state, CASE WHEN pg_is_in_recovery() = false THEN EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) ELSE NULL END AS lag_seconds, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn)) AS sent_bytes, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS replay_bytes FROM pg_stat_replication;"]]{{RUN}}

**What to observe**:
- **lag_seconds**: How far behind the standby is (in seconds)
- **sent_bytes**: WAL data sent to standby
- **replay_bytes**: WAL data applied on standby
- Low lag (< 5 seconds) indicates healthy replication

---

### Task 3: Check WAL (Write-Ahead Log) Information

Let's examine WAL information related to replication.

**Check current WAL position**:
```sql
SELECT 
    pg_current_wal_lsn() AS current_lsn,
    pg_walfile_name(pg_current_wal_lsn()) AS wal_file_name,
    pg_size_pretty(pg_wal_lsn_diff('0/0', pg_current_wal_lsn())) AS total_wal_size;
```

[[gsql -d postgres -p 5432 -c "SELECT pg_current_wal_lsn() AS current_lsn, pg_walfile_name(pg_current_wal_lsn()) AS wal_file_name, pg_size_pretty(pg_wal_lsn_diff('0/0', pg_current_wal_lsn())) AS total_wal_size;"]]{{RUN}}

**What to observe**:
- **current_lsn**: Current WAL log sequence number
- **wal_file_name**: Current WAL file name
- **total_wal_size**: Total WAL generated since cluster start

**Check WAL archive status**:
```sql
SHOW archive_mode;
SHOW archive_command;
```

[[gsql -d postgres -p 5432 -c "SHOW archive_mode;"]]{{RUN}}
[[gsql -d postgres -p 5432 -c "SHOW archive_command;"]]{{RUN}}

**What to observe**:
- **archive_mode**: 'on' means WAL archiving is enabled
- **archive_command**: Command used to archive WAL files

---

### Task 4: Test Data Replication

Let's verify that data written to the primary is replicated to the standby.

**Create a test table on primary**:
```sql
CREATE TABLE IF NOT EXISTS ha_test (
    id INT PRIMARY KEY,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE IF NOT EXISTS ha_test (id INT PRIMARY KEY, data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"]]{{RUN}}

**Insert test data**:
```sql
INSERT INTO ha_test (id, data) VALUES 
    (1, 'Test data 1'),
    (2, 'Test data 2'),
    (3, 'Test data 3');
```

[[gsql -d postgres -p 5432 -c "INSERT INTO ha_test (id, data) VALUES (1, 'Test data 1'), (2, 'Test data 2'), (3, 'Test data 3');"]]{{RUN}}

**Verify data on primary**:
```sql
SELECT * FROM ha_test ORDER BY id;
```

[[gsql -d postgres -p 5432 -c "SELECT * FROM ha_test ORDER BY id;"]]{{RUN}}

**Note**: To verify on standby, you would need to connect to the standby database and run the same query. The data should appear after the replication lag period (typically < 5 seconds in healthy setups).

---

### Task 5: Check Synchronous Replication Configuration

Let's examine synchronous replication settings.

**Check synchronous standby settings**:
```sql
SHOW synchronous_standby_names;
```

[[gsql -d postgres -p 5432 -c "SHOW synchronous_standby_names;"]]{{RUN}}

**What to observe**:
- **empty or '*'**: Asynchronous replication (standby can be arbitrarily behind)
- **Specific names**: Only named standbys are synchronous (must be fully up-to-date before commit)
- Example: `standby1, standby2` or `ANY 2 (standby1, standby2, standby3)`

**Check synchronous commit setting**:
```sql
SHOW synchronous_commit;
```

[[gsql -d postgres -p 5432 -c "SHOW synchronous_commit;"]]{{RUN}}

**What to observe**:
- **on**: Waits for synchronous standby confirmation before commit (safer but slower)
- **off**: Does not wait (faster but risk of data loss on failover)
- **local**: Waits only for local WAL write (fastest, least safe)

---

### Task 6: Monitor HA Cluster Health

Let's check the overall health of the HA cluster.

**Check cluster status**:
```sql
SELECT 
    pg_is_in_recovery() AS is_standby,
    CASE 
        WHEN pg_is_in_recovery() THEN 'STANDBY'
        ELSE 'PRIMARY'
    END AS role,
    pg_current_wal_lsn() AS current_lsn,
    count(*) AS active_replicas
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -c "SELECT pg_is_in_recovery() AS is_standby, CASE WHEN pg_is_in_recovery() THEN 'STANDBY' ELSE 'PRIMARY' END AS role, pg_current_wal_lsn() AS current_lsn, count(*) AS active_replicas FROM pg_stat_replication;"]]{{RUN}}

**Check replication statistics**:
```sql
SELECT 
    application_name,
    state,
    sync_state,
    sync_priority,
    flush_lag,
    replay_lag,
    write_lag
FROM pg_stat_replication
ORDER BY sync_state, sync_priority;
```

[[gsql -d postgres -p 5432 -c "SELECT application_name, state, sync_state, sync_priority, flush_lag, replay_lag, write_lag FROM pg_stat_replication ORDER BY sync_state, sync_priority;"]]{{RUN}}

**What to observe**:
- **sync_priority**: Priority for synchronous standby (1 = highest priority)
- **flush_lag**: Time for standby to flush WAL to disk
- **replay_lag**: Time for standby to apply WAL (should be < 1 second)
- **write_lag**: Time for standby to write WAL

---

### Task 7: Understand Failover Concepts

Let's understand what happens during a failover operation.

**Note**: Do NOT run failover commands in this lab - this is for understanding only.

**Manual failover process** (for knowledge):
```bash
# On standby, promote to primary:
gs_ctl promote -D /path/to/standby/data
```

**Automatic failover** (requires external tools):
- Tools like CM (Cluster Manager) or HAProxy monitor primary health
- Automatic promotion when primary fails
- Requires proper configuration of monitoring and failover scripts

**Switchover** (planned maintenance):
1. Stop writes on primary
2. Wait for standby to catch up
3. Promote standby to new primary
4. Repoint application to new primary
5. Convert old primary to standby

**Key Points**:
- Failover is automatic or manual promotion during failure
- Switchover is planned role reversal for maintenance
- Both result in a new primary database
- Applications must reconnect to new primary

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Checked database role and replication status
- [ ] Task 2: Monitored replication lag
- [ ] Task 3: Examined WAL information
- [ ] Task 4: Tested data replication
- [ ] Task 5: Checked synchronous replication configuration
- [ ] Task 6: Monitored HA cluster health
- [ ] Task 7: Understood failover concepts

## Review Questions

1. **What does pg_is_in_recovery() returning false indicate?**
   - [ ] Database is a standby
   - [ ] Database is a primary
   - [ ] Database is in recovery mode
   - [ ] Database is offline

2. **What is the difference between synchronous and asynchronous replication?**
   - [ ] No difference
   - [ ] Synchronous waits for standby confirmation, asynchronous does not
   - [ ] Asynchronous is safer
   - [ ] Synchronous is faster

3. **What does replication lag measure?**
   - [ ] Network latency
   - [ ] Time difference between primary and standby data
   - [ ] Query execution time
   - [ ] Connection establishment time

4. **What is the difference between failover and switchover?**
   - [ ] No difference
   - [ ] Failover is unplanned, switchover is planned
   - [ ] Switchover is unplanned, failover is planned
   - [ ] Both require manual intervention

## Summary

In this L1 lab, you explored:
- **HA Concepts**: Understanding primary-standby architecture
- **Replication Monitoring**: Checking replication status and lag
- **WAL Information**: Examining WAL logs and archiving
- **Data Replication**: Verifying data replication to standby
- **Synchronous Replication**: Understanding sync vs async modes
- **Cluster Health**: Monitoring overall HA cluster status
- **Failover Concepts**: Understanding failover vs switchover

These basic HA concepts are essential for understanding high availability in GaussDB.

## Next Steps

Proceed to **L2 Lab** to practice intermediate HA operations including:
- Configuring primary-standby replication
- Performing manual failover
- Configuring synchronous replication
- Monitoring and alerting for HA issues
- Managing multiple standby databases
