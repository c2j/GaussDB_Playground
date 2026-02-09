# Installation Module - L2 Lab: Primary-Standby Setup

## Lab Overview

In this L2 (Intermediate Level) lab, you will practice setting up a primary-standby GaussDB configuration, including:
- Configuring network and firewall settings
- Setting up replication
- Performing initial data synchronization
- Verifying replication status

**Time Required**: 35 minutes
**Prerequisites**: Completed L1 Installation Lab, root access, two GaussDB installations

## Learning Objectives

By completing this lab, you will be able to:
- Configure primary-standby replication
- Set up network and firewall for replication
- Perform initial data synchronization
- Monitor and verify replication status

## Lab Tasks

### Task 1: Prepare Network Configuration

Let's configure network settings for primary-standby communication.

**Check current network configuration**:
```bash
ip addr show | grep -E "inet |inet6"
```

[[ip addr show | grep -E "inet |inet6"]]{{RUN}}

**Configure firewall to allow replication**:
```bash
# Allow GaussDB port (5432) for replication
firewall-cmd --permanent --add-port=5432/tcp
firewall-cmd --reload
```

[[firewall-cmd --permanent --add-port=5432/tcp]]{{RUN}}
[[firewall-cmd --reload]]{{RUN}}

**Verify firewall rules**:
```bash
firewall-cmd --list-all
```

[[firewall-cmd --list-all]]{{RUN}}

**Check port listening status**:
```bash
netstat -tlnp | grep 5432
```

[[netstat -tlnp | grep 5432]]{{RUN}}

---

### Task 2: Configure Primary Database

Let's configure the primary database for replication.

**Create replication user on primary**:
```sql
-- Connect to primary
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'Replicate!';
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'Replicate!';"]]{{RUN}}

**Edit postgresql.conf on primary**:
```bash
# Listen on all interfaces
listen_addresses = '*'

# Enable WAL for replication
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 32
```

[[cat >> /opt/huawei/install/data/db1/postgresql.conf << 'EOF'
# Replication Settings
listen_addresses = '*'
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 32
EOF]]{{RUN}}

**Configure pg_hba.conf on primary**:
```bash
# Add replication entry
echo "host    replication     replicator      <standby_ip>/32      md5" >> /opt/huawei/install/data/db1/pg_hba.conf
```

[[echo "host    replication     replicator      <standby_ip>/32      md5" >> /opt/huawei/install/data/db1/pg_hba.conf]]{{RUN}}

**Reload primary configuration**:
```bash
gs_ctl reload -D /opt/huawei/install/data/db1
```

[[gs_ctl reload -D /opt/huawei/install/data/db1]]{{RUN}}

---

### Task 3: Take Base Backup of Primary

Let's create a physical backup of the primary to initialize the standby.

**Stop standby database (if running)**:
```bash
gs_ctl stop -D /opt/huawei/install/data/standby
```

[[gs_ctl stop -D /opt/huawei/install/data/standby]]{{RUN}}

**Create standby data directory**:
```bash
rm -rf /opt/huawei/install/data/standby
mkdir -p /opt/huawei/install/data/standby
chown -R omm:omm /opt/huawei/install/data/standby
```

[[rm -rf /opt/huawei/install/data/standby]]{{RUN}}
[[mkdir -p /opt/huawei/install/data/standby]]{{RUN}}
[[chown -R omm:omm /opt/huawei/install/data/standby]]{{RUN}}

**Perform base backup to initialize standby**:
```bash
gs_basebackup -h <primary_ip> -p 5432 -U replicator -D /opt/huawei/install/data/standby -Fp -X stream -P
```

[[gs_basebackup -h <primary_ip> -p 5432 -U replicator -D /opt/huawei/install/data/standby -Fp -X stream -P]]{{RUN}}

**What to observe**:
- `-D`: Target directory for standby data
- `-Fp`: Plain format
- `-X stream`: Include WAL files
- `-P`: Show progress

---

### Task 4: Configure Standby Database

Let's configure the standby database to connect to primary.

**Create standby.signal file**:
```bash
touch /opt/huawei/install/data/standby/standby.signal
```

[[touch /opt/huawei/install/data/standby/standby.signal]]{{RUN}}

**Create primary_conn_info file**:
```bash
cat > /opt/huawei/install/data/standby/primary_conn_info << 'EOF'
host=<primary_ip> port=5432 user=replicator password=Replicate! application_name=standby1
EOF
```

[[cat > /opt/huawei/install/data/standby/primary_conn_info << 'EOF'
host=<primary_ip> port=5432 user=replicator password=Replicate! application_name=standby1
EOF]]{{RUN}}

**Configure postgresql.conf on standby**:
```bash
cat >> /opt/huawei/install/data/standby/postgresql.conf << 'EOF'
# Standby Configuration
port = 5433
hot_standby = on
max_standby_streaming_delay = -1
```
```

[[cat >> /opt/huawei/install/data/standby/postgresql.conf << 'EOF'
# Standby Configuration
port = 5433
hot_standby = on
max_standby_streaming_delay = -1
EOF]]{{RUN}}

**Set correct permissions**:
```bash
chown -R omm:omm /opt/huawei/install/data/standby
chmod 700 /opt/huawei/install/data/standby/primary_conn_info
```

[[chown -R omm:omm /opt/huawei/install/data/standby]]{{RUN}}
[[chmod 700 /opt/huawei/install/data/standby/primary_conn_info]]{{RUN}}

---

### Task 5: Start Standby Database

Let's start the standby database and begin replication.

**Start standby database**:
```bash
gs_ctl start -D /opt/huawei/install/data/standby
```

[[gs_ctl start -D /opt/huawei/install/data/standby]]{{RUN}}

**Check standby logs for errors**:
```bash
tail -50 /opt/huawei/install/data/standby/log/*.log
```

[[tail -50 /opt/huawei/install/data/standby/log/*.log]]{{RUN}}

**What to look for**:
- "database system is ready to accept read only connections" - standby is ready
- "replication connection authorized" - replication established
- "restarting WAL streaming" - replication active

---

### Task 6: Verify Replication Status

Let's verify that replication is working correctly.

**Check replication status from primary**:
```sql
-- Connect to primary
SELECT 
    usename AS replication_user,
    application_name,
    client_addr AS standby_ip,
    state,
    sync_state,
    sync_priority,
    pg_size_pretty(sent_lsn) AS bytes_sent,
    pg_size_pretty(write_lsn) AS bytes_written,
    pg_size_pretty(flush_lsn) AS bytes_flushed,
    pg_size_pretty(replay_lsn) AS bytes_replayed,
    round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS replay_lag_seconds
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT usename AS replication_user, application_name, client_addr AS standby_ip, state, sync_state, sync_priority, pg_size_pretty(sent_lsn) AS bytes_sent, pg_size_pretty(write_lsn) AS bytes_written, pg_size_pretty(flush_lsn) AS bytes_flushed, pg_size_pretty(replay_lsn) AS bytes_replayed, round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS replay_lag_seconds FROM pg_stat_replication;"]]{{RUN}}

**What to observe**:
- **state**: Should be 'streaming'
- **sync_state**: 'async' for asynchronous replication
- **replay_lag_seconds**: Should be < 5 seconds in healthy setup

**Check standby role**:
```sql
-- Connect to standby
SELECT pg_is_in_recovery() AS is_standby;
```

[[gsql -d postgres -p 5433 -h <standby_ip> -c "SELECT pg_is_in_recovery() AS is_standby;"]]{{RUN}}

**Expected**: true (confirming it's a standby)

---

### Task 7: Test Data Replication

Let's verify that data written to primary is replicated to standby.

**Create test table on primary**:
```sql
-- Connect to primary
CREATE TABLE replication_test (
    id INT PRIMARY KEY,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO replication_test (id, data) VALUES 
    (1, 'Test replication'),
    (2, 'Another test'),
    (3, 'Third test');

SELECT * FROM replication_test ORDER BY id;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "CREATE TABLE replication_test (id INT PRIMARY KEY, data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO replication_test (id, data) VALUES (1, 'Test replication'), (2, 'Another test'), (3, 'Third test'); SELECT * FROM replication_test ORDER BY id;"]]{{RUN}}

**Wait for replication** (wait 5-10 seconds), then check on standby:
```sql
-- Connect to standby
SELECT * FROM replication_test ORDER BY id;
```

[[gsql -d postgres -p 5433 -h <standby_ip> -c "SELECT * FROM replication_test ORDER BY id;"]]{{RUN}}

**Expected**: Same 3 rows as primary (replication working)

---

### Task 8: Monitor Replication Lag

Let's continuously monitor replication lag over time.

**Check current lag**:
```sql
-- Connect to primary
SELECT 
    application_name,
    client_addr,
    state,
    round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds,
    pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS bytes_behind
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT application_name, client_addr, state, round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds, pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS bytes_behind FROM pg_stat_replication;"]]{{RUN}}

**Insert more test data and monitor lag**:
```sql
-- Insert 1000 rows on primary
INSERT INTO replication_test (id, data)
SELECT 
    generate_series(4, 1003),
    'Replication test ' || generate_series(4, 1003)
FROM generate_series(4, 1003);
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "INSERT INTO replication_test (id, data) SELECT generate_series(4, 1003), 'Replication test ' || generate_series(4, 1003) FROM generate_series(4, 1003);"]]{{RUN}}

**Check lag again**:
```sql
SELECT 
    application_name,
    round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds,
    pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS bytes_behind
FROM pg_stat_replication;
```

[[gsql -d postgres -p 5432 -h <primary_ip> -c "SELECT application_name, round(EXTRACT(EPOCH FROM (now() - replay_lsn_time)), 2) AS lag_seconds, pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS bytes_behind FROM pg_stat_replication;"]]{{RUN}}

**What to observe**:
- Lag should increase during bulk insert
- Lag should decrease as standby catches up
- Eventually lag should return to < 5 seconds

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Configured network and firewall for replication
- [ ] Task 2: Configured primary database for replication
- [ ] Task 3: Took base backup of primary to initialize standby
- [ ] Task 4: Configured standby database with replication settings
- [ ] Task 5: Started standby database successfully
- [ ] Task 6: Verified replication status
- [ ] Task 7: Tested data replication from primary to standby
- [ ] Task 8: Monitored replication lag during data load

## Review Questions

1. **What does wal_level = replica enable?**
   - [ ] Better performance
   - [ ] WAL logging required for replication
   - [ ] Automatic failover
   - [ ] Synchronous replication

2. **What file indicates a database should start in standby mode?**
   - [ ] postgresql.conf
   - [ ] pg_hba.conf
   - [ ] standby.signal
   - [ ] recovery.conf

3. **What is the purpose of wal_keep_segments?**
   - [ ] Improve performance
   - [ ] Keep WAL segments for standby to catch up
   - [ ] Enable compression
   - [ ] Control checkpoint frequency

4. **What does pg_is_in_recovery() returning true indicate?**
   - [ ] Database is primary
   - [ ] Database is standby (read-only)
   - [ ] Database is recovering from crash
   - [ ] Database is offline

## Summary

In this L2 lab, you practiced:
- **Network Configuration**: Setting up firewall and network for replication
- **Primary Configuration**: Creating replication user and configuring WAL settings
- **Base Backup**: Using gs_basebackup to initialize standby
- **Standby Configuration**: Setting up standby.signal and primary_conn_info
- **Replication Monitoring**: Verifying replication status and lag
- **Data Replication**: Testing that data flows from primary to standby

These intermediate operations enable you to set up and manage primary-standby replication for high availability.

## Best Practices

1. **Security**: Use strong passwords for replication users
2. **Network**: Configure firewall rules to restrict replication to specific IPs
3. **Monitoring**: Continuously monitor replication lag
4. **Testing**: Regularly test failover procedures
5. **Backups**: Maintain backups even with replication

## Next Steps

Proceed to **L3 Lab** to practice advanced operations including:
- Synchronous replication configuration
- Failover and switchover procedures
- Multi-node cluster setup
- Cross-region disaster recovery
