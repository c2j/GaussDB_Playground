# GaussDB Architecture Module - L3 Lab: Advanced Architecture Optimization

## Lab Overview

In this L3 (Advanced Level) lab, you will practice advanced architecture optimization techniques in GaussDB, including:
- Process and thread optimization for high concurrency
- Advanced memory management and tuning
- WAL configuration for performance
- Checkpoint tuning for I/O optimization
- Autovacuum optimization strategies

**Time Required**: 50 minutes
**Prerequisites**: Completed L1 and L2 Architecture Labs, access to postgresql.conf

## Learning Objectives

By completing this lab, you will be able to:
- Optimize GaussDB process and thread configuration
- Tune memory parameters for high-performance workloads
- Configure WAL for better throughput
- Optimize checkpoint settings for I/O efficiency
- Fine-tune autovacuum for maintenance automation

## Lab Tasks

### Task 1: Optimize Process and Thread Configuration

GaussDB uses multi-process architecture; optimize for high concurrency.

**Check current process configuration**:
```sql
SHOW max_connections;
SHOW superuser_reserved_connections;
SHOW work_mem;
SHOW maintenance_work_mem;
```

[[gsql -d postgres -p 5432 -c "SHOW max_connections; SHOW superuser_reserved_connections; SHOW work_mem; SHOW maintenance_work_mem;"]]{{RUN}}

**Check active connections**:
```sql
SELECT 
    state,
    COUNT(*) AS connection_count
FROM pg_stat_activity
GROUP BY state
ORDER BY connection_count DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT state, COUNT(*) AS connection_count FROM pg_stat_activity GROUP BY state ORDER BY connection_count DESC;"]]{{RUN}}

**Optimize work_mem for sort operations**:
```sql
SET work_mem = '64MB';

EXPLAIN ANALYZE
SELECT * FROM (
    SELECT 
        customer_id,
        SUM(amount) AS total_spent,
        COUNT(*) AS order_count
    FROM (
        SELECT 
            (random() * 1000)::INT AS customer_id,
            (random() * 1000)::NUMERIC(12, 2) AS amount
        FROM generate_series(1, 10000)
    ) orders
    GROUP BY customer_id
) sorted
ORDER BY total_spent DESC;
```

[[gsql -d postgres -p 5432 -c "SET work_mem = '64MB'; EXPLAIN ANALYZE SELECT * FROM (SELECT customer_id, SUM(amount) AS total_spent, COUNT(*) AS order_count FROM (SELECT (random() * 1000)::INT AS customer_id, (random() * 1000)::NUMERIC(12, 2) AS amount FROM generate_series(1, 10000)) orders GROUP BY customer_id) sorted ORDER BY total_spent DESC;"]]{{RUN}}

**Compare with lower work_mem**:
```sql
SET work_mem = '4MB';

EXPLAIN ANALYZE
SELECT * FROM (
    SELECT 
        customer_id,
        SUM(amount) AS total_spent,
        COUNT(*) AS order_count
    FROM (
        SELECT 
            (random() * 1000)::INT AS customer_id,
            (random() * 1000)::NUMERIC(12, 2) AS amount
        FROM generate_series(1, 10000)
    ) orders
    GROUP BY customer_id
) sorted
ORDER BY total_spent DESC;
```

[[gsql -d postgres -p 5432 -c "SET work_mem = '4MB'; EXPLAIN ANALYZE SELECT * FROM (SELECT customer_id, SUM(amount) AS total_spent, COUNT(*) AS order_count FROM (SELECT (random() * 1000)::INT AS customer_id, (random() * 1000)::NUMERIC(12, 2) AS amount FROM generate_series(1, 10000)) orders GROUP BY customer_id) sorted ORDER BY total_spent DESC;"]]{{RUN}}

**What to observe**:
- Higher work_mem allows in-memory sorting (no disk spill)
- Lower work_mem may cause disk writes and slower performance
- "External Merge Disk" indicates disk spill occurred

---

### Task 2: Advanced Memory Management

Optimize shared buffers and cache for high-throughput workloads.

**Check current memory configuration**:
```sql
SHOW shared_buffers;
SHOW effective_cache_size;
```

[[gsql -d postgres -p 5432 -c "SHOW shared_buffers; SHOW effective_cache_size;"]]{{RUN}}

**Check buffer cache hit ratio**:
```sql
SELECT 
    sum(heap_blks_read) AS heap_read,
    sum(heap_blks_hit) AS heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 AS cache_hit_ratio
FROM pg_statio_user_tables;
```

[[gsql -d postgres -p 5432 -c "SELECT sum(heap_blks_read) AS heap_read, sum(heap_blks_hit) AS heap_hit, sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 AS cache_hit_ratio FROM pg_statio_user_tables;"]]{{RUN}}

**Create test table and check cache impact**:
```sql
CREATE TABLE cache_test (
    id INT PRIMARY KEY,
    data TEXT
);

INSERT INTO cache_test
SELECT 
    generate_series(1, 100000),
    'Data: ' || generate_series(1, 100000) || ' ' || repeat('x', 100);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE cache_test (id INT PRIMARY KEY, data TEXT); INSERT INTO cache_test SELECT generate_series(1, 100000), 'Data: ' || generate_series(1, 100000) || ' ' || repeat('x', 100);"]]{{RUN}}

**First query (cache miss)**:
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM cache_test WHERE id = 50000;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM cache_test WHERE id = 50000;"]]{{RUN}}

**Second query (cache hit)**:
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM cache_test WHERE id = 50000;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM cache_test WHERE id = 50000;"]]{{RUN}}

**What to observe**:
- First query shows "shared read" (disk read)
- Second query shows "shared hit" (cache read)
- Cache hit ratio should increase after repeated queries

---

### Task 3: WAL Configuration for Performance

Optimize WAL (Write-Ahead Log) for high-throughput workloads.

**Check current WAL configuration**:
```sql
SHOW wal_level;
SHOW fsync;
SHOW synchronous_commit;
SHOW wal_buffers;
SHOW wal_writer_delay;
SHOW commit_delay;
```

[[gsql -d postgres -p 5432 -c "SHOW wal_level; SHOW fsync; SHOW synchronous_commit; SHOW wal_buffers; SHOW wal_writer_delay; SHOW commit_delay;"]]{{RUN}}

**Test synchronous vs asynchronous commit**:
```sql
CREATE TABLE wal_test (id INT, data TEXT);

-- Synchronous commit (default)
SET synchronous_commit = 'on';
\timing on

INSERT INTO wal_test
SELECT generate_series(1, 10000), 'Test data';

-- Asynchronous commit (faster but less safe)
SET synchronous_commit = 'off';

INSERT INTO wal_test
SELECT generate_series(10001, 20000), 'Test data';

\timing off
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE wal_test (id INT, data TEXT); SET synchronous_commit = 'on'; \\timing on INSERT INTO wal_test SELECT generate_series(1, 10000), 'Test data'; SET synchronous_commit = 'off'; INSERT INTO wal_test SELECT generate_series(10001, 20000), 'Test data'; \\timing off"]]{{RUN}}

**Check WAL file size and location**:
```sql
SELECT pg_current_wal_lsn();
SELECT pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) AS wal_size;
```

[[gsql -d postgres -p 5432 -c "SELECT pg_current_wal_lsn(); SELECT pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) AS wal_size;"]]{{RUN}}

**What to observe**:
- Asynchronous commit is faster but can lose data on crash
- WAL logs protect data integrity
- WAL files grow with transaction volume

---

### Task 4: Optimize Checkpoint Settings

Checkpoints write dirty buffers to disk; optimize for I/O efficiency.

**Check checkpoint configuration**:
```sql
SHOW checkpoint_completion_target;
SHOW checkpoint_warning;
SHOW checkpoint_timeout;
SHOW max_wal_size;
SHOW min_wal_size;
```

[[gsql -d postgres -p 5432 -c "SHOW checkpoint_completion_target; SHOW checkpoint_warning; SHOW checkpoint_warning; SHOW max_wal_size; SHOW min_wal_size;"]]{{RUN}}

**Monitor checkpoint activity**:
```sql
SELECT 
    checkpoints_timed,
    checkpoints_req,
    checkpoint_write_time,
    checkpoint_sync_time,
    buffers_checkpoint,
    buffers_clean,
    maxwritten_clean,
    buffers_backend,
    buffers_backend_fsync
FROM pg_stat_bgwriter;
```

[[gsql -d postgres -p 5432 -c "SELECT checkpoints_timed, checkpoints_req, checkpoint_write_time, checkpoint_sync_time, buffers_checkpoint, buffers_clean, maxwritten_clean, buffers_backend, buffers_backend_fsync FROM pg_stat_bgwriter;"]]{{RUN}}

**Optimize for spread checkpoint I/O**:
```sql
SET checkpoint_completion_target = 0.9;
SET max_wal_size = '2GB';
SET min_wal_size = '1GB';

-- Generate some WAL activity
CREATE TABLE checkpoint_test AS
SELECT generate_series(1, 100000) AS id,
    random() * 100 AS value;

UPDATE checkpoint_test SET value = value * 1.1 WHERE id % 100 = 0;
```

[[gsql -d postgres -p 5432 -c "SET checkpoint_completion_target = 0.9; SET max_wal_size = '2GB'; SET min_wal_size = '1GB'; CREATE TABLE checkpoint_test AS SELECT generate_series(1, 100000) AS id, random() * 100 AS value; UPDATE checkpoint_test SET value = value * 1.1 WHERE id % 100 = 0;"]]{{RUN}}

**Re-check checkpoint stats**:
```sql
SELECT 
    checkpoints_timed,
    checkpoints_req,
    buffers_checkpoint,
    buffers_clean
FROM pg_stat_bgwriter;
```

[[gsql -d postgres -p 5432 -c "SELECT checkpoints_timed, checkpoints_req, buffers_checkpoint, buffers_clean FROM pg_stat_bgwriter;"]]{{RUN}}

**What to observe**:
- Higher completion_target spreads checkpoint I/O over longer time
- Buffers written during checkpoints reduce I/O spikes
- Checkpoints triggered by timeout or WAL size

---

### Task 5: Autovacuum Optimization

Autovacuum maintains table statistics and reclaims space; optimize for workload.

**Check autovacuum configuration**:
```sql
SHOW autovacuum;
SHOW autovacuum_max_workers;
SHOW autovacuum_naptime;
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_analyze_threshold;
SHOW autovacuum_vacuum_scale_factor;
SHOW autovacuum_analyze_scale_factor;
```

[[gsql -d postgres -p 5432 -c "SHOW autovacuum; SHOW autovacuum_max_workers; SHOW autovacuum_naptime; SHOW autovacuum_vacuum_threshold; SHOW autovacuum_analyze_threshold; SHOW autovacuum_vacuum_scale_factor; SHOW autovacuum_analyze_scale_factor;"]]{{RUN}}

**Monitor autovacuum activity**:
```sql
SELECT 
    relname AS table_name,
    last_autovacuum,
    last_autoanalyze,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    autovacuum_count,
    autoanalyze_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT relname AS table_name, last_autovacuum, last_autoanalyze, n_live_tup AS live_tuples, n_dead_tup AS dead_tuples, autovacuum_count, autoanalyze_count FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;"]]{{RUN}}

**Create high-activity table and monitor**:
```sql
CREATE TABLE vacuum_test (
    id INT,
    data TEXT,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO vacuum_test
SELECT generate_series(1, 100000), 'Data', CURRENT_TIMESTAMP;

-- Generate dead tuples through updates
UPDATE vacuum_test SET data = 'Updated' WHERE id % 100 = 0;
UPDATE vacuum_test SET data = 'Updated again' WHERE id % 50 = 0;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE vacuum_test (id INT, data TEXT, updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO vacuum_test SELECT generate_series(1, 100000), 'Data', CURRENT_TIMESTAMP; UPDATE vacuum_test SET data = 'Updated' WHERE id % 100 = 0; UPDATE vacuum_test SET data = 'Updated again' WHERE id % 50 = 0;"]]{{RUN}}

**Force vacuum and analyze**:
```sql
VACUUM (VERBOSE, ANALYZE) vacuum_test;
```

[[gsql -d postgres -p 5432 -c "VACUUM (VERBOSE, ANALYZE) vacuum_test;"]]{{RUN}}

**Check autovacuum settings for specific table**:
```sql
SELECT 
    reloptions
FROM pg_class
WHERE relname = 'vacuum_test';
```

[[gsql -d postgres -p 5432 -c "SELECT reloptions FROM pg_class WHERE relname = 'vacuum_test';"]]{{RUN}}

**Set custom autovacuum parameters**:
```sql
ALTER TABLE vacuum_test SET (
    autovacuum_vacuum_threshold = 1000,
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_threshold = 500,
    autovacuum_analyze_scale_factor = 0.05
);
```

[[gsql -d postgres -p 5432 -c "ALTER TABLE vacuum_test SET (autovacuum_vacuum_threshold = 1000, autovacuum_vacuum_scale_factor = 0.1, autovacuum_analyze_threshold = 500, autovacuum_analyze_scale_factor = 0.05);"]]{{RUN}}

**What to observe**:
- Autovacuum runs based on threshold + scale_factor
- Dead tuples accumulate from UPDATE/DELETE operations
- Custom table-level autovacuum settings override defaults

---

### Task 6: Optimize Background Writer

Background writer writes dirty buffers to disk periodically.

**Check background writer settings**:
```sql
SHOW bgwriter_delay;
SHOW bgwriter_lru_maxpages;
SHOW bgwriter_lru_multiplier;
SHOW bgwriter_flush_after;
```

[[gsql -d postgres -p 5432 -c "SHOW bgwriter_delay; SHOW bgwriter_lru_maxpages; SHOW bgwriter_lru_multiplier; SHOW bgwriter_flush_after;"]]{{RUN}}

**Monitor background writer performance**:
```sql
SELECT 
    maxwritten_clean AS maxwritten,
    buffers_alloc AS allocated,
    buffers_backend AS backend_writes,
    buffers_clean AS bgwriter_writes
FROM pg_stat_bgwriter;
```

[[gsql -d postgres -p 5432 -c "SELECT maxwritten_clean AS maxwritten, buffers_alloc AS allocated, buffers_backend AS backend_writes, buffers_clean AS bgwriter_writes FROM pg_stat_bgwriter;"]]{{RUN}}

**What to observe**:
- **maxwritten_clean**: High values indicate buffer shortage
- **buffers_alloc**: New buffers allocated from OS
- **buffers_clean**: Pages written by background writer
- Optimize bgwriter settings to reduce maxwritten_clean

---

### Task 7: Connection Pool Analysis

Analyze connection usage and optimize for concurrent workload.

**Check connection statistics**:
```sql
SELECT 
    state,
    COUNT(*) AS count,
    AVG(EXTRACT(EPOCH FROM (now() - query_start))) AS avg_query_duration
FROM pg_stat_activity
WHERE state IS NOT NULL
GROUP BY state
ORDER BY count DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT state, COUNT(*) AS count, AVG(EXTRACT(EPOCH FROM (now() - query_start))) AS avg_query_duration FROM pg_stat_activity WHERE state IS NOT NULL GROUP BY state ORDER BY count DESC;"]]{{RUN}}

**Check long-running queries**:
```sql
SELECT 
    pid,
    state,
    EXTRACT(EPOCH FROM (now() - query_start)) AS duration_seconds,
    LEFT(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state = 'active'
    AND now() - query_start > INTERVAL '1 minute'
ORDER BY duration_seconds DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT pid, state, EXTRACT(EPOCH FROM (now() - query_start)) AS duration_seconds, LEFT(query, 100) AS query_preview FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > INTERVAL '1 minute' ORDER BY duration_seconds DESC;"]]{{RUN}}

**What to observe**:
- Idle connections waste resources
- Long-running queries block resources
- Consider connection pooling for high concurrency

---

### Task 8: Clean Up Test Data

**Drop test tables**:
```sql
DROP TABLE cache_test;
DROP TABLE wal_test;
DROP TABLE checkpoint_test;
DROP TABLE vacuum_test;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE cache_test; DROP TABLE wal_test; DROP TABLE checkpoint_test; DROP TABLE vacuum_test;"]]{{RUN}}

**Verify cleanup**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

[[gsql -d postgres -p 5432 -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Optimized process and thread configuration
- [ ] Task 2: Managed memory and cache efficiently
- [ ] Task 3: Configured WAL for performance
- [ ] Task 4: Optimized checkpoint settings
- [ ] Task 5: Fine-tuned autovacuum parameters
- [ ] Task 6: Analyzed background writer performance
- [ ] Task 7: Analyzed connection pool usage
- [ ] Task 8: Cleaned up test data

## Review Questions

1. **What is the purpose of work_mem?**
   - [ ] Total memory for all connections
   - [ ] Memory for sorting and hashing per operation
   - [ ] Cache for frequently accessed data
   - [ ] Memory for background processes

2. **When should you use asynchronous commit?**
   - [ ] For critical financial data
   - [ ] For high-throughput low-latency workloads
   - [ ] For small databases
   - [ ] For read-heavy workloads

3. **What do checkpoints do?**
   - [ ] Verify data integrity
   - [ ] Write dirty buffers to disk
   - [ ] Clean up dead tuples
   - [ ] Update statistics

4. **What does autovacuum do?**
   - [ ] Compress data files
   - [ ] Reclaim space and update statistics
   - [ ] Optimize queries
   - [ ] Create indexes

## Summary

In this L3 lab, you practiced:
- **Process Optimization**: Tuning work_mem and connection settings
- **Memory Management**: Understanding shared buffers and cache hit ratios
- **WAL Configuration**: Balancing performance and data safety
- **Checkpoint Tuning**: Optimizing I/O spread and reducing spikes
- **Autovacuum**: Customizing maintenance automation
- **Background Writer**: Monitoring and optimizing background processes
- **Connection Analysis**: Identifying connection pool bottlenecks

These advanced architecture optimization techniques enable you to tune GaussDB for high-performance, production workloads.

## Next Steps

Proceed to **L4 Lab** to practice expert-level operations including:
- Complex architecture troubleshooting
- Multi-instance coordination
- Advanced monitoring and alerting
- Performance bottleneck analysis
- Resource contention resolution
