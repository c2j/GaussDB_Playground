# Architecture Module - L2 Lab: Process and Memory Optimization

## Lab Overview

In this L2 (Intermediate Level) lab, you will practice advanced architecture operations in GaussDB, including:
- Analyzing process statistics in detail
- Monitoring memory usage patterns
- Configuring memory parameters
- Understanding checkpoint and WAL operations

**Time Required**: 30 minutes
**Prerequisites**: Completed L1 Architecture Lab, GaussDB running

## Learning Objectives

By completing this lab, you will be able to:
- Analyze process-level statistics for performance insights
- Monitor memory allocation and identify bottlenecks
- Configure checkpoint and WAL parameters for optimal performance
- Tune memory parameters for different workloads

## Lab Tasks

### Task 1: Analyze Process Statistics

Let's examine detailed process statistics to understand resource utilization.

**View backend process details**:
```sql
SELECT 
    pid,
    usename AS username,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    waiting,
    query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start;
```

[[gsql -d postgres -p 5432 -c "SELECT pid, usename AS username, application_name, client_addr, state, query_start, state_change, waiting, query FROM pg_stat_activity WHERE state = 'active' ORDER BY query_start;"]]{{RUN}}

**What to observe**:
- **waiting**: True if process is waiting for a lock or resource
- **query_start**: When the current query started
- **state_change**: When the last state change occurred
- Long-running queries may indicate performance issues

**Check for blocked processes**:
```sql
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocked_activity.query AS blocked_statement,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocking_activity.query AS blocking_statement,
    blocked_activity.waiting
FROM pg_catalog.pg_locks blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity 
        ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks blocking_locks 
        ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
        AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
        AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
        AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
        AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
        AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
        AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
        AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
        AND blocking_locks.pid != blocked_locks.pid
    JOIN pg_catalog.pg_stat_activity blocking_activity 
        ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;
```

[[gsql -d postgres -p 5432 -c "SELECT blocked_locks.pid AS blocked_pid, blocked_activity.usename AS blocked_user, blocked_activity.query AS blocked_statement, blocking_locks.pid AS blocking_pid, blocking_activity.usename AS blocking_user, blocking_activity.query AS blocking_statement, blocked_activity.waiting FROM pg_catalog.pg_locks blocked_locks JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid AND blocking_locks.pid != blocked_locks.pid JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid WHERE NOT blocked_locks.GRANTED;"]]{{RUN}}

**What to observe**:
- This query shows which processes are blocking others
- Blocked processes have waiting = true
- Identify long-running blocking queries that need optimization

---

### Task 2: Monitor Memory Usage

Let's examine detailed memory allocation statistics.

**Check shared memory usage**:
```sql
SELECT 
    count(*) AS shared_buffers_hit,
    pg_size_pretty(sum(blks_hit) * 8192) AS total_data_from_cache,
    pg_size_pretty(sum(blks_read) * 8192) AS total_data_from_disk,
    round(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = current_database();
```

[[gsql -d postgres -p 5432 -c "SELECT count(*) AS shared_buffers_hit, pg_size_pretty(sum(blks_hit) * 8192) AS total_data_from_cache, pg_size_pretty(sum(blks_read) * 8192) AS total_data_from_disk, round(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) AS cache_hit_ratio FROM pg_stat_database WHERE datname = current_database();"]]{{RUN}}

**What to observe**:
- **cache_hit_ratio**: Should be >95% in production
- Low ratio indicates need for larger shared_buffers
- High ratio means good cache utilization

**Check temporary file usage**:
```sql
SELECT 
    datname AS database_name,
    temp_files AS temp_files_created,
    pg_size_pretty(temp_bytes) AS temp_file_size
FROM pg_stat_database
WHERE temp_files > 0
ORDER BY temp_bytes DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT datname AS database_name, temp_files AS temp_files_created, pg_size_pretty(temp_bytes) AS temp_file_size FROM pg_stat_database WHERE temp_files > 0 ORDER BY temp_bytes DESC;"]]{{RUN}}

**What to observe**:
- High temp file usage indicates insufficient work_mem or maintenance_work_mem
- Consider increasing these parameters if temp_files are large

---

### Task 3: Analyze Checkpoint Activity

Let's examine checkpoint statistics to understand I/O patterns.

**Check checkpoint statistics**:
```sql
SELECT 
    checkpoints_timed AS scheduled_checkpoints,
    checkpoints_req AS requested_checkpoints,
    checkpoint_write_time AS total_write_time_sec,
    checkpoint_sync_time AS total_sync_time_sec,
    buffers_checkpoint AS buffers_written_per_checkpoint,
    checkpoint_sync_time AS checkpoints_sync_time
FROM pg_stat_bgwriter;
```

[[gsql -d postgres -p 5432 -c "SELECT checkpoints_timed AS scheduled_checkpoints, checkpoints_req AS requested_checkpoints, checkpoint_write_time AS total_write_time_sec, checkpoint_sync_time AS total_sync_time_sec, buffers_checkpoint AS buffers_written_per_checkpoint, checkpoint_sync_time AS checkpoints_sync_time FROM pg_stat_bgwriter;"]]{{RUN}}

**What to observe**:
- **checkpoints_req**: High value indicates checkpoints requested by system (bad)
- **checkpoints_timed**: Scheduled checkpoints (normal)
- High requested checkpoints suggest need for more frequent scheduled checkpoints

**Check background writer activity**:
```sql
SELECT 
    buffers_alloc AS buffers_allocated,
    buffers_backend AS buffers_written_by_backends,
    buffers_backend_fsync AS fsync_by_backends,
    buffers_clean AS buffers_cleaned_by_bgwriter,
    maxwritten_clean AS times_bgwriter_stopped_due_to_limit
FROM pg_stat_bgwriter;
```

[[gsql -d postgres -p 5432 -c "SELECT buffers_alloc AS buffers_allocated, buffers_backend AS buffers_written_by_backends, buffers_backend_fsync AS fsync_by_backends, buffers_clean AS buffers_cleaned_by_bgwriter, maxwritten_clean AS times_bgwriter_stopped_due_to_limit FROM pg_stat_bgwriter;"]]{{RUN}}

**What to observe**:
- **buffers_backend_fsync**: Should be low (background writer handles most)
- **maxwritten_clean**: High value indicates bgwriter is overwhelmed

---

### Task 4: Configure Checkpoint Parameters

Let's tune checkpoint parameters for better performance.

**Check current checkpoint settings**:
```sql
SHOW shared_buffers;
SHOW checkpoint_completion_target;
SHOW checkpoint_timeout;
SHOW checkpoint_segments;
```

[[gsql -d postgres -p 5432 -c "SHOW shared_buffers; SHOW checkpoint_completion_target; SHOW checkpoint_timeout; SHOW checkpoint_segments;"]]{{RUN}}

**Understand parameters**:
- **shared_buffers**: Memory for data cache (25-40% of RAM)
- **checkpoint_completion_target**: 0-1, target for checkpoint spread (0.5 = 50%)
- **checkpoint_timeout**: Time between scheduled checkpoints (300s = 5 min)
- **checkpoint_segments**: WAL segments before checkpoint (obsolete in newer versions)

**Optimize checkpoint settings**:
```sql
-- Example: Set more frequent checkpoints to reduce I/O spikes
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET checkpoint_timeout = 300;
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET checkpoint_completion_target = 0.7; ALTER SYSTEM SET checkpoint_timeout = 300;"]]{{RUN}}

**Reload configuration**:
```bash
gs_ctl reload -D /opt/huawei/install/data/db1
```

[[gs_ctl reload -D /opt/huawei/install/data/db1]]{{RUN}}

---

### Task 5: Monitor WAL Activity

Let's examine WAL generation and archiving statistics.

**Check WAL generation rate**:
```sql
SELECT 
    pg_walfile_name(pg_current_wal_lsn()) AS current_wal_file,
    pg_current_wal_lsn() AS current_lsn,
    pg_size_pretty(pg_wal_lsn_diff('0/0', pg_current_wal_lsn())) AS total_wal_size
FROM pg_stat_database
WHERE datname = current_database();
```

[[gsql -d postgres -p 5432 -c "SELECT pg_walfile_name(pg_current_wal_lsn()) AS current_wal_file, pg_current_wal_lsn() AS current_lsn, pg_size_pretty(pg_wal_lsn_diff('0/0', pg_current_wal_lsn())) AS total_wal_size FROM pg_stat_database WHERE datname = current_database();"]]{{RUN}}

**Check WAL archiving status**:
```sql
SELECT 
    archived_count AS archived_wal_files,
    last_archived_wal AS last_archived_file,
    last_archived_time AS last_archived_timestamp,
    failed_count AS failed_archives,
    last_failed_wal AS last_failed_file,
    last_failed_time AS last_failed_timestamp
FROM pg_stat_archiver;
```

[[gsql -d postgres -p 5432 -c "SELECT archived_count AS archived_wal_files, last_archived_wal AS last_archived_file, last_archived_time AS last_archived_timestamp, failed_count AS failed_archives, last_failed_wal AS last_failed_file, last_failed_time AS last_failed_timestamp FROM pg_stat_archiver;"]]{{RUN}}

**What to observe**:
- **failed_count**: Should be 0 (no failed archives)
- **last_failed_time**: Null indicates successful archiving
- High WAL generation rate may indicate excessive writes

---

### Task 6: Tune Memory Parameters

Let's configure memory parameters based on workload characteristics.

**Check current memory settings**:
```sql
SELECT name, setting, unit, short_desc
FROM pg_settings
WHERE name IN (
    'shared_buffers',
    'work_mem',
    'maintenance_work_mem',
    'effective_cache_size',
    'max_connections'
)
ORDER BY name;
```

[[gsql -d postgres -p 5432 -c "SELECT name, setting, unit, short_desc FROM pg_settings WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem', 'effective_cache_size', 'max_connections') ORDER BY name;"]]{{RUN}}

**Calculate optimal memory allocation**:
For a 16GB server with 100 max connections:

```sql
-- shared_buffers: 25-40% of RAM = 4-6GB
-- effective_cache_size: 50-75% of RAM = 8-12GB (OS cache + DB cache)
-- work_mem: (RAM - shared_buffers) / (max_connections * 3) = ~64MB
-- maintenance_work_mem: work_mem * 2 = ~128MB

-- Example: Configure for OLTP workload
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET shared_buffers = '4GB'; ALTER SYSTEM SET effective_cache_size = '12GB'; ALTER SYSTEM SET work_mem = '64MB'; ALTER SYSTEM SET maintenance_work_mem = '256MB';"]]{{RUN}}

**Note**: These are example values. Adjust based on your server's actual RAM and workload.

---

### Task 7: Monitor Autovacuum Activity

Let's analyze autovacuum performance and configuration.

**Check autovacuum statistics**:
```sql
SELECT 
    relname AS table_name,
    autovacuum_count AS autovacuum_runs,
    autovacuum_analyze AS analyze_runs,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    round(100.0 * n_dead_tup / NULLIF(n_live_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables
ORDER BY dead_ratio DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT relname AS table_name, autovacuum_count AS autovacuum_runs, autovacuum_analyze AS analyze_runs, n_live_tup AS live_rows, n_dead_tup AS dead_rows, round(100.0 * n_dead_tup / NULLIF(n_live_tup, 0), 2) AS dead_ratio FROM pg_stat_user_tables ORDER BY dead_ratio DESC LIMIT 10;"]]{{RUN}}

**What to observe**:
- **dead_ratio**: High ratio (>20%) indicates frequent updates/deletes
- **autovacuum_runs**: Tables with low runs but high dead_rows need manual VACUUM
- Tables with high dead_ratio may need lower autovacuum thresholds

**Check autovacuum configuration**:
```sql
SHOW autovacuum;
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_analyze_threshold;
SHOW autovacuum_vacuum_scale_factor;
```

[[gsql -d postgres -p 5432 -c "SHOW autovacuum; SHOW autovacuum_vacuum_threshold; SHOW autovacuum_analyze_threshold; SHOW autovacuum_vacuum_scale_factor;"]]{{RUN}}

**Tune autovacuum for active tables**:
```sql
-- Lower thresholds for tables with frequent updates
ALTER SYSTEM SET autovacuum_vacuum_threshold = 50;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET autovacuum_vacuum_threshold = 50; ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;"]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Analyzed process statistics and identified blocking issues
- [ ] Task 2: Monitored memory usage and cache hit ratio
- [ ] Task 3: Examined checkpoint activity and background writer
- [ ] Task 4: Configured checkpoint parameters
- [ ] Task 5: Monitored WAL activity and archiving
- [ ] Task 6: Tuned memory parameters for workload
- [ ] Task 7: Analyzed autovacuum and tuned configuration

## Review Questions

1. **What does a high checkpoint_req value indicate?**
   - [ ] System is healthy
   - [ ] Checkpoints are forced by system (suboptimal)
   - [ ] Need more RAM
   - [ ] Background writer is working well

2. **What is a good cache hit ratio for production databases?**
   - [ ] 50-60%
   - [ ] 70-80%
   - [ ] >95%
   - [ ] 100%

3. **What does a high buffers_backend_fsync value indicate?**
   - [ ] Good performance
   - [ ] Background writer is overwhelmed
   - [ ] Need more connections
   - [ ] Checkpoints are too frequent

4. **What parameter controls memory for sorting operations?**
   - [ ] shared_buffers
   - [ ] work_mem
   - [ ] maintenance_work_mem
   - [ ] effective_cache_size

## Summary

In this L2 lab, you practiced:
- **Process Analysis**: Examining detailed process statistics and blocking
- **Memory Monitoring**: Tracking cache hit ratio and temp file usage
- **Checkpoint Optimization**: Tuning checkpoint frequency and completion target
- **WAL Monitoring**: Tracking WAL generation and archiving
- **Memory Tuning**: Configuring shared_buffers, work_mem, and maintenance_work_mem
- **Autovacuum Analysis**: Monitoring vacuum activity and tuning thresholds

These intermediate architecture operations enable you to optimize GaussDB performance through proper memory and checkpoint configuration.

## Next Steps

Proceed to **L3 Lab** to practice advanced operations including:
- Deep dive into memory architecture internals
- Advanced WAL tuning and compression
- Process priority and resource control
- Multi-process coordination and optimization
- Production-grade performance tuning
