# Performance Tuning Module - L1 Lab: Basic Performance Monitoring

## Lab Overview

In this L1 (Entry Level) lab, you will practice basic performance monitoring in GaussDB, including:
- Viewing system views for performance statistics
- Identifying slow queries
- Checking table and index usage
- Monitoring database connections

**Time Required**: 20 minutes
**Prerequisites**: GaussDB running with some data in tables

## Learning Objectives

By completing this lab, you will be able to:
- Query system views to gather performance metrics
- Identify slow and long-running queries
- Check table and index statistics
- Monitor database connection activity

## Lab Tasks

### Task 1: Monitor Database Activity

Let's check overall database activity using system views.

**View database-level statistics**:
```sql
SELECT 
    datname AS database_name,
    numbackends AS active_connections,
    xact_commit AS transactions_committed,
    xact_rollback AS transactions_rolled_back,
    blks_read AS blocks_read,
    blks_hit AS blocks_hit,
    round(100.0 * blks_hit / (blks_hit + blks_read), 2) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = current_database();
```

[[gsql -d postgres -p 5432 -c "SELECT datname AS database_name, numbackends AS active_connections, xact_commit AS transactions_committed, xact_rollback AS transactions_rolled_back, blks_read AS blocks_read, blks_hit AS blocks_hit, round(100.0 * blks_hit / (blks_hit + blks_read), 2) AS cache_hit_ratio FROM pg_stat_database WHERE datname = current_database();"]]{{RUN}}

**What to observe**:
- **active_connections**: Number of current connections
- **transactions_committed**: Number of committed transactions
- **transactions_rolled_back**: Number of rolled back transactions
- **cache_hit_ratio**: Percentage of data served from cache (should be >95% in production)

---

### Task 2: Identify Slow Queries

Let's find queries that are taking a long time to execute.

**Check currently running queries**:
```sql
SELECT 
    pid AS process_id,
    usename AS username,
    application_name,
    datname AS database_name,
    state,
    query_start,
    now() - query_start AS duration,
    left(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state = 'active'
    AND query_start < now() - INTERVAL '1 minute'
ORDER BY duration DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT pid AS process_id, usename AS username, application_name, datname AS database_name, state, query_start, now() - query_start AS duration, left(query, 100) AS query_preview FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - INTERVAL '1 minute' ORDER BY duration DESC;"]]{{RUN}}

**What to observe**:
- This query finds queries that have been running for more than 1 minute
- Review the query_preview to understand what the query is doing

**Check for idle in transaction** (potential issue):
```sql
SELECT 
    pid,
    usename,
    datname,
    state,
    query_start,
    now() - query_start AS duration,
    left(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY duration DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT pid, usename, datname, state, query_start, now() - query_start AS duration, left(query, 100) AS query_preview FROM pg_stat_activity WHERE state = 'idle in transaction' ORDER BY duration DESC;"]]{{RUN}}

**What to observe**:
- Connections in "idle in transaction" state hold locks and can cause issues
- Long-running idle transactions should be investigated

---

### Task 3: Check Table Statistics

Let's examine table-level performance statistics.

**View table access statistics**:
```sql
SELECT 
    schemaname AS schema_name,
    relname AS table_name,
    seq_scan AS sequential_scans,
    seq_tup_read AS tuples_read_seq,
    idx_scan AS index_scans,
    idx_tup_fetch AS tuples_fetched_idx,
    n_tup_ins AS tuples_inserted,
    n_tup_upd AS tuples_updated,
    n_tup_del AS tuples_deleted,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples
FROM pg_stat_user_tables
ORDER BY seq_scan DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT schemaname AS schema_name, relname AS table_name, seq_scan AS sequential_scans, seq_tup_read AS tuples_read_seq, idx_scan AS index_scans, idx_tup_fetch AS tuples_fetched_idx, n_tup_ins AS tuples_inserted, n_tup_upd AS tuples_updated, n_tup_del AS tuples_deleted, n_live_tup AS live_tuples, n_dead_tup AS dead_tuples FROM pg_stat_user_tables ORDER BY seq_scan DESC LIMIT 10;"]]{{RUN}}

**What to observe**:
- **sequential_scans**: Number of full table scans (high values may need indexing)
- **index_scans**: Number of index scans
- **live_tuples**: Number of live rows
- **dead_tuples**: Number of dead rows (high values may need VACUUM)

**Calculate sequential scan ratio**:
```sql
SELECT 
    relname AS table_name,
    seq_scan AS seq_scans,
    idx_scan AS idx_scans,
    CASE 
        WHEN (seq_scan + idx_scan) > 0 
        THEN round(100.0 * seq_scan / (seq_scan + idx_scan), 2)
        ELSE 0 
    END AS seq_scan_ratio,
    CASE 
        WHEN (seq_scan + idx_scan) > 0 
        THEN round(100.0 * idx_scan / (seq_scan + idx_scan), 2)
        ELSE 0 
    END AS idx_scan_ratio
FROM pg_stat_user_tables
WHERE (seq_scan + idx_scan) > 0
ORDER BY seq_scan DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT relname AS table_name, seq_scan AS seq_scans, idx_scan AS idx_scans, CASE WHEN (seq_scan + idx_scan) > 0 THEN round(100.0 * seq_scan / (seq_scan + idx_scan), 2) ELSE 0 END AS seq_scan_ratio, CASE WHEN (seq_scan + idx_scan) > 0 THEN round(100.0 * idx_scan / (seq_scan + idx_scan), 2) ELSE 0 END AS idx_scan_ratio FROM pg_stat_user_tables WHERE (seq_scan + idx_scan) > 0 ORDER BY seq_scan DESC LIMIT 10;"]]{{RUN}}

**Key Insight**:
- High sequential scan ratio (>50%) indicates tables may need indexes
- Consider adding indexes for frequently queried columns

---

### Task 4: Check Index Usage

Let's analyze index performance and identify unused indexes.

**View index statistics**:
```sql
SELECT 
    schemaname AS schema_name,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'RARELY_USED'
        ELSE 'USED'
    END AS usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC
LIMIT 20;
```

[[gsql -d postgres -p 5432 -c "SELECT schemaname AS schema_name, relname AS table_name, indexrelname AS index_name, idx_scan AS index_scans, idx_tup_read AS tuples_read, idx_tup_fetch AS tuples_fetched, CASE WHEN idx_scan = 0 THEN 'UNUSED' WHEN idx_scan < 10 THEN 'RARELY_USED' ELSE 'USED' END AS usage_status FROM pg_stat_user_indexes ORDER BY idx_scan ASC LIMIT 20;"]]{{RUN}}

**What to observe**:
- **UNUSED**: Index never used (candidate for removal)
- **RARELY_USED**: Index used less than 10 times (evaluate necessity)
- **USED**: Index used regularly

**Identify most effective indexes**:
```sql
SELECT 
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    round(1.0 * idx_tup_fetch / NULLIF(idx_scan, 0), 2) AS avg_tuples_per_scan
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT schemaname, relname AS table_name, indexrelname AS index_name, idx_scan AS index_scans, idx_tup_read AS tuples_read, idx_tup_fetch AS tuples_fetched, round(1.0 * idx_tup_fetch / NULLIF(idx_scan, 0), 2) AS avg_tuples_per_scan FROM pg_stat_user_indexes WHERE idx_scan > 0 ORDER BY idx_scan DESC LIMIT 10;"]]{{RUN}}

---

### Task 5: Monitor Locks

Let's check for locks that might be blocking queries.

**View current locks**:
```sql
SELECT 
    l.locktype,
    l.database,
    l.relation,
    l.page,
    l.tuple,
    l.virtualxid,
    l.transactionid,
    l.classid,
    l.objid,
    l.objsubid,
    l.virtualtransaction,
    l.pid,
    l.mode,
    l.granted,
    a.usename,
    a.query,
    a.query_start
FROM pg_locks l
LEFT JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted
ORDER BY a.query_start;
```

[[gsql -d postgres -p 5432 -c "SELECT l.locktype, l.database, l.relation, l.page, l.tuple, l.virtualxid, l.transactionid, l.classid, l.objid, l.objsubid, l.virtualtransaction, l.pid, l.mode, l.granted, a.usename, a.query, a.query_start FROM pg_locks l LEFT JOIN pg_stat_activity a ON l.pid = a.pid WHERE NOT l.granted ORDER BY a.query_start;"]]{{RUN}}

**What to observe**:
- This query shows locks that are waiting (NOT granted)
- Long-waiting locks may indicate blocking issues

**Check lock wait times**:
```sql
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement,
    blocked_activity.application_name AS blocked_application,
    blocking_activity.application_name AS blocking_application
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
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
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;
```

[[gsql -d postgres -p 5432 -c "SELECT blocked_locks.pid AS blocked_pid, blocked_activity.usename AS blocked_user, blocking_locks.pid AS blocking_pid, blocking_activity.usename AS blocking_user, blocked_activity.query AS blocked_statement, blocking_activity.query AS blocking_statement, blocked_activity.application_name AS blocked_application, blocking_activity.application_name AS blocking_application FROM pg_catalog.pg_locks blocked_locks JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid AND blocking_locks.pid != blocked_locks.pid JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid WHERE NOT blocked_locks.GRANTED;"]]{{RUN}}

---

### Task 6: Check Configuration Parameters

Let's review important performance-related configuration parameters.

**View key performance parameters**:
```sql
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings
WHERE name IN (
    'shared_buffers',
    'work_mem',
    'maintenance_work_mem',
    'effective_cache_size',
    'random_page_cost',
    'seq_page_cost',
    'cpu_tuple_cost',
    'cpu_index_tuple_cost',
    'max_connections',
    'max_worker_processes'
)
ORDER BY name;
```

[[gsql -d postgres -p 5432 -c "SELECT name, setting, unit, short_desc FROM pg_settings WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem', 'effective_cache_size', 'random_page_cost', 'seq_page_cost', 'cpu_tuple_cost', 'cpu_index_tuple_cost', 'max_connections', 'max_worker_processes') ORDER BY name;"]]{{RUN}}

**What to observe**:
- **shared_buffers**: Memory for data caching (25-40% of RAM)
- **work_mem**: Memory per sorting/hashing operation
- **effective_cache_size**: Hint to optimizer about system cache (usually 50-75% of RAM)

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Monitored database activity and cache hit ratio
- [ ] Task 2: Identified slow queries and idle transactions
- [ ] Task 3: Examined table statistics and sequential scans
- [ ] Task 4: Analyzed index usage and identified unused indexes
- [ ] Task 5: Checked for blocking locks
- [ ] Task 6: Reviewed performance-related configuration parameters

## Review Questions

1. **What does a cache hit ratio of 98% indicate?**
   - [ ] Poor performance
   - [ ] Excellent performance (most data from cache)
   - [ ] Need more memory
   - [ ] Need more indexes

2. **What does a high sequential scan ratio (>50%) suggest?**
   - [ ] Table has good indexes
   - [ ] Table may need additional indexes
   - [ ] Queries are optimized
   - [ ] Database is slow

3. **What does an "idle in transaction" state mean?**
   - [ ] Connection is processing a query
   - [ ] Connection is waiting for new query within a transaction
   - [ ] Connection is closed
   - [ ] Connection is in error state

4. **Which parameter controls memory for sorting operations?**
   - [ ] shared_buffers
   - [ ] work_mem
   - [ ] maintenance_work_mem
   - [ ] effective_cache_size

## Summary

In this L1 lab, you practiced:
- **Database Monitoring**: Queryed pg_stat_database for overall activity metrics
- **Query Analysis**: Identified slow queries and long-running transactions
- **Table Statistics**: Examined table access patterns and sequential scans
- **Index Analysis**: Monitored index usage and identified unused indexes
- **Lock Monitoring**: Checked for blocking locks and lock waits
- **Configuration Review**: Reviewed key performance parameters

These basic monitoring techniques help you identify performance bottlenecks and optimize your GaussDB database.

## Next Steps

Proceed to **L2 Lab** to practice intermediate performance tuning including:
- Using EXPLAIN to analyze query execution plans
- Basic index design principles
- Optimizing slow queries
- Parameter tuning for different workloads
