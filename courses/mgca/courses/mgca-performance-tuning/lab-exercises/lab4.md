# Performance Tuning Module - L4 Lab: Expert-Level Production Performance Optimization

## Lab Overview

In this L4 (Expert Level) lab, you will practice expert-level performance optimization techniques for production-grade challenges in GaussDB, including:
- Complex query optimization with multi-dimensional analysis
- Large-scale index management strategies
- Distributed query optimization
- Real-time performance monitoring and tuning
- Production incident troubleshooting

**Time Required**: 75 minutes
**Prerequisites**: Completed all previous Performance Tuning Labs, experience with production databases

## Learning Objectives

By completing this lab, you will be able to:
- Diagnose and resolve complex performance issues
- Optimize queries for production workloads at scale
- Implement advanced monitoring and alerting
- Handle production incidents effectively
- Design performance optimization strategies

## Lab Tasks

### Task 1: Diagnose Complex Performance Issues

Analyze and resolve multi-dimensional performance problems in production.

**Create complex production scenario**:
```sql
-- Production-scale tables
CREATE TABLE orders_prod (
    order_id BIGINT PRIMARY KEY,
    customer_id BIGINT,
    product_id BIGINT,
    order_date TIMESTAMP,
    ship_date TIMESTAMP,
    status VARCHAR(20),
    amount NUMERIC(15, 2),
    tax NUMERIC(12, 2),
    discount NUMERIC(10, 2),
    region VARCHAR(20),
    sales_channel VARCHAR(30),
    priority INT
) PARTITION BY RANGE (order_date);

-- Create partitions for 2 years
DO $$
DECLARE
    start_date DATE := '2023-01-01';
BEGIN
    FOR i IN 0..23 LOOP
        EXECUTE format('
            CREATE TABLE orders_prod_%s PARTITION OF orders_prod
            FOR VALUES FROM (%L) TO (%L)',
            i * 100 + 202300,
            start_date + (i * 30) * INTERVAL '1 day',
            start_date + ((i + 1) * 30) * INTERVAL '1 day'
        );
        start_date := start_date + 30 * INTERVAL '1 day';
    END LOOP;
END $$;

-- Insert production-scale data
INSERT INTO orders_prod
SELECT 
    generate_series(1, 5000000) AS order_id,
    (random() * 1000000)::BIGINT + 1 AS customer_id,
    (random() * 500000)::BIGINT + 1 AS product_id,
    '2023-01-01'::timestamp + (random() * 730)::INT * INTERVAL '1 day' AS order_date,
    '2023-01-01'::timestamp + (random() * 730)::INT * INTERVAL '1 day' + (random() * 7)::INT * INTERVAL '1 day' AS ship_date,
    (ARRAY['pending', 'processing', 'shipped', 'delivered', 'cancelled'])[floor(random() * 5 + 1)] AS status,
    (random() * 10000)::NUMERIC(15, 2) AS amount,
    (random() * 1000)::NUMERIC(12, 2) AS tax,
    (random() * 500)::NUMERIC(10, 2) AS discount,
    (ARRAY['north', 'south', 'east', 'west', 'central'])[floor(random() * 5 + 1)] AS region,
    (ARRAY['online', 'retail', 'b2b', 'wholesale'])[floor(random() * 4 + 1)] AS sales_channel,
    (random() * 10 + 1)::INT AS priority;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE orders_prod (order_id BIGINT PRIMARY KEY, customer_id BIGINT, product_id BIGINT, order_date TIMESTAMP, ship_date TIMESTAMP, status VARCHAR(20), amount NUMERIC(15, 2), tax NUMERIC(12, 2), discount NUMERIC(10, 2), region VARCHAR(20), sales_channel VARCHAR(30), priority INT) PARTITION BY RANGE (order_date); DO \$\$ DECLARE start_date DATE := '2023-01-01'; BEGIN FOR i IN 0..23 LOOP EXECUTE format('CREATE TABLE orders_prod_%s PARTITION OF orders_prod FOR VALUES FROM (%L) TO (%L)', i * 100 + 202300, start_date + (i * 30) * INTERVAL '1 day', start_date + ((i + 1) * 30) * INTERVAL '1 day'); start_date := start_date + 30 * INTERVAL '1 day'; END LOOP; END \$\$; INSERT INTO orders_prod SELECT generate_series(1, 5000000) AS order_id, (random() * 1000000)::BIGINT + 1 AS customer_id, (random() * 500000)::BIGINT + 1 AS product_id, '2023-01-01'::timestamp + (random() * 730)::INT * INTERVAL '1 day' AS order_date, '2023-01-01'::timestamp + (random() * 730)::INT * INTERVAL '1 day' + (random() * 7)::INT * INTERVAL '1 day' AS ship_date, (ARRAY['pending', 'processing', 'shipped', 'delivered', 'cancelled'])[floor(random() * 5 + 1)] AS status, (random() * 10000)::NUMERIC(15, 2) AS amount, (random() * 1000)::NUMERIC(12, 2) AS tax, (random() * 500)::NUMERIC(10, 2) AS discount, (ARRAY['north', 'south', 'east', 'west', 'central'])[floor(random() * 5 + 1)] AS region, (ARRAY['online', 'retail', 'b2b', 'wholesale'])[floor(random() * 4 + 1)] AS sales_channel, (random() * 10 + 1)::INT AS priority;"]]{{RUN}}

**Identify performance bottlenecks**:
```sql
-- Query 1: Slow reporting query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    region,
    sales_channel,
    DATE_TRUNC('month', order_date) AS month,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_order_value,
    MAX(amount) AS max_order_value,
    STDDEV(amount) AS std_dev
FROM orders_prod
WHERE order_date >= '2024-01-01'
    AND order_date < '2025-01-01'
    AND status IN ('delivered', 'shipped')
GROUP BY region, sales_channel, DATE_TRUNC('month', order_date)
ORDER BY region, sales_channel, month;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT region, sales_channel, DATE_TRUNC('month', order_date) AS month, COUNT(*) AS order_count, SUM(amount) AS total_amount, AVG(amount) AS avg_order_value, MAX(amount) AS max_order_value, STDDEV(amount) AS std_dev FROM orders_prod WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01' AND status IN ('delivered', 'shipped') GROUP BY region, sales_channel, DATE_TRUNC('month', order_date) ORDER BY region, sales_channel, month;"]]{{RUN}}

**Create strategic indexes**:
```sql
-- Composite index for filtering and grouping
CREATE INDEX idx_orders_prod_region_channel_date 
ON orders_prod(region, sales_channel, order_date)
WHERE status IN ('delivered', 'shipped');

-- Partial index for active orders
CREATE INDEX idx_orders_prod_active 
ON orders_prod(customer_id, product_id, amount, order_date)
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days';

-- Create summary table for faster reporting
CREATE MATERIALIZED VIEW orders_monthly_summary AS
SELECT 
    region,
    sales_channel,
    DATE_TRUNC('month', order_date) AS month,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_order_value
FROM orders_prod
WHERE status IN ('delivered', 'shipped')
GROUP BY region, sales_channel, DATE_TRUNC('month', order_date);

CREATE INDEX idx_summary_region_month ON orders_monthly_summary(region, month);
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_orders_prod_region_channel_date ON orders_prod(region, sales_channel, order_date) WHERE status IN ('delivered', 'shipped'); CREATE INDEX idx_orders_prod_active ON orders_prod(customer_id, product_id, amount, order_date) WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'; CREATE MATERIALIZED VIEW orders_monthly_summary AS SELECT region, sales_channel, DATE_TRUNC('month', order_date) AS month, COUNT(*) AS order_count, SUM(amount) AS total_amount, AVG(amount) AS avg_order_value FROM orders_prod WHERE status IN ('delivered', 'shipped') GROUP BY region, sales_channel, DATE_TRUNC('month', order_date); CREATE INDEX idx_summary_region_month ON orders_monthly_summary(region, month);"]]{{RUN}}

**Optimize query using summary table**:
```sql
-- Optimized query using materialized view
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    region,
    sales_channel,
    month,
    order_count,
    total_amount,
    avg_order_value
FROM orders_monthly_summary
WHERE month >= '2024-01-01'
ORDER BY region, sales_channel, month;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT region, sales_channel, month, order_count, total_amount, avg_order_value FROM orders_monthly_summary WHERE month >= '2024-01-01' ORDER BY region, sales_channel, month;"]]{{RUN}}

**What to observe**:
- Partition pruning reduces scan range
- Composite indexes optimize filter + group by
- Materialized views provide pre-aggregated data
- Buffer hits indicate cache effectiveness

---

### Task 2: Real-Time Performance Monitoring

Set up comprehensive production monitoring system.

**Create performance monitoring schema**:
```sql
CREATE SCHEMA monitoring;

-- Query performance tracking
CREATE TABLE monitoring.query_performance (
    query_id BIGSERIAL PRIMARY KEY,
    query_hash VARCHAR(64),
    query_text TEXT,
    exec_count INT DEFAULT 1,
    total_exec_time NUMERIC(15, 2),
    avg_exec_time NUMERIC(10, 2),
    max_exec_time NUMERIC(10, 2),
    rows_returned BIGINT,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System metrics tracking
CREATE TABLE monitoring.system_metrics (
    metric_id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100),
    metric_value NUMERIC(20, 6),
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert thresholds
CREATE TABLE monitoring.alert_thresholds (
    metric_name VARCHAR(100) PRIMARY KEY,
    warning_threshold NUMERIC(20, 6),
    critical_threshold NUMERIC(20, 6),
    evaluation_window_minutes INT
);
```

[[gsql -d postgres -p 5432 -c "CREATE SCHEMA monitoring; CREATE TABLE monitoring.query_performance (query_id BIGSERIAL PRIMARY KEY, query_hash VARCHAR(64), query_text TEXT, exec_count INT DEFAULT 1, total_exec_time NUMERIC(15, 2), avg_exec_time NUMERIC(10, 2), max_exec_time NUMERIC(10, 2), rows_returned BIGINT, first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE TABLE monitoring.system_metrics (metric_id BIGSERIAL PRIMARY KEY, metric_name VARCHAR(100), metric_value NUMERIC(20, 6), metric_unit VARCHAR(20), recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE TABLE monitoring.alert_thresholds (metric_name VARCHAR(100) PRIMARY KEY, warning_threshold NUMERIC(20, 6), critical_threshold NUMERIC(20, 6), evaluation_window_minutes INT);"]]{{RUN}}

**Create performance analysis function**:
```sql
CREATE OR REPLACE FUNCTION monitoring.analyze_slow_queries()
RETURNS TABLE (
    query_hash VARCHAR(64),
    query_preview TEXT,
    avg_exec_time NUMERIC(10, 2),
    exec_count INT,
    trend VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.query_hash,
        LEFT(q.query_text, 200) AS query_preview,
        q.avg_exec_time,
        q.exec_count,
        CASE 
            WHEN q.avg_exec_time > (SELECT critical_threshold FROM monitoring.alert_thresholds WHERE metric_name = 'avg_query_time') THEN 'CRITICAL'
            WHEN q.avg_exec_time > (SELECT warning_threshold FROM monitoring.alert_thresholds WHERE metric_name = 'avg_query_time') THEN 'WARNING'
            ELSE 'OK'
        END AS trend
    FROM monitoring.query_performance q
    WHERE q.last_seen > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ORDER BY q.avg_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Insert alert thresholds
INSERT INTO monitoring.alert_thresholds VALUES
('avg_query_time', 1000, 5000, 60),
('replication_lag', 5000, 30000, 5),
('cache_hit_ratio', 95, 90, 5),
('connection_count', 80, 95, 5);
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE FUNCTION monitoring.analyze_slow_queries() RETURNS TABLE (query_hash VARCHAR(64), query_preview TEXT, avg_exec_time NUMERIC(10, 2), exec_count INT, trend VARCHAR(20)) AS \$\$ BEGIN RETURN QUERY SELECT q.query_hash, LEFT(q.query_text, 200) AS query_preview, q.avg_exec_time, q.exec_count, CASE WHEN q.avg_exec_time > (SELECT critical_threshold FROM monitoring.alert_thresholds WHERE metric_name = 'avg_query_time') THEN 'CRITICAL' WHEN q.avg_exec_time > (SELECT warning_threshold FROM monitoring.alert_thresholds WHERE metric_name = 'avg_query_time') THEN 'WARNING' ELSE 'OK' END AS trend FROM monitoring.query_performance q WHERE q.last_seen > CURRENT_TIMESTAMP - INTERVAL '1 hour' ORDER BY q.avg_exec_time DESC LIMIT 20; END; \$\$ LANGUAGE plpgsql; INSERT INTO monitoring.alert_thresholds VALUES ('avg_query_time', 1000, 5000, 60), ('replication_lag', 5000, 30000, 5), ('cache_hit_ratio', 95, 90, 5), ('connection_count', 80, 95, 5);"]]{{RUN}}

**Create comprehensive dashboard view**:
```sql
CREATE OR REPLACE VIEW monitoring.performance_dashboard AS
SELECT 
    now() AS dashboard_time,
    (SELECT COUNT(*) FROM pg_stat_activity) AS active_connections,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') AS active_queries,
    (SELECT COUNT(*) FROM pg_stat_replication) AS standby_count,
    (SELECT AVG(replay_lag) FROM pg_stat_replication) AS avg_replication_lag_ms,
    (SELECT SUM(heap_blks_hit) * 100.0 / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0) FROM pg_statio_user_tables) AS cache_hit_ratio,
    (SELECT AVG(EXTRACT(EPOCH FROM (now() - query_start))) FROM pg_stat_activity WHERE state = 'active') AS avg_query_duration_s,
    (SELECT COUNT(*) FROM pg_locks WHERE NOT granted) AS blocked_queries,
    (SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size,
    (SELECT pg_size_pretty(pg_total_relation_size('orders_prod')) AS orders_table_size;

SELECT * FROM monitoring.performance_dashboard;
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE VIEW monitoring.performance_dashboard AS SELECT now() AS dashboard_time, (SELECT COUNT(*) FROM pg_stat_activity) AS active_connections, (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') AS active_queries, (SELECT COUNT(*) FROM pg_stat_replication) AS standby_count, (SELECT AVG(replay_lag) FROM pg_stat_replication) AS avg_replication_lag_ms, (SELECT SUM(heap_blks_hit) * 100.0 / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0) FROM pg_statio_user_tables) AS cache_hit_ratio, (SELECT AVG(EXTRACT(EPOCH FROM (now() - query_start))) FROM pg_stat_activity WHERE state = 'active') AS avg_query_duration_s, (SELECT COUNT(*) FROM pg_locks WHERE NOT granted) AS blocked_queries, (SELECT pg_size_pretty(pg_database_size(current_database()))) AS database_size, (SELECT pg_size_pretty(pg_total_relation_size('orders_prod'))) AS orders_table_size; SELECT * FROM monitoring.performance_dashboard;"]]{{RUN}}

**What to observe**:
- Dashboard provides comprehensive system view
- Alert thresholds enable proactive response
- Monitoring schema captures performance data
- Real-time metrics support operational decisions

---

### Task 3: Production Incident Resolution

Simulate and resolve production performance incident.

**Simulate performance degradation**:
```sql
-- Record baseline
SELECT * FROM monitoring.performance_dashboard;

-- Create large blocking transaction
BEGIN;

-- Lock many rows to create contention
UPDATE orders_prod 
SET status = 'processing' 
WHERE status = 'pending' 
    AND order_date >= '2024-01-01'
LIMIT 100000;

-- Keep transaction open to simulate long-running transaction
-- (In real incident, this might be forgotten transaction or lock issue)
SELECT 'Long transaction started - keeping it open...' AS status;
```

[[gsql -d postgres -p 5432 -c "SELECT * FROM monitoring.performance_dashboard; BEGIN; UPDATE orders_prod SET status = 'processing' WHERE status = 'pending' AND order_date >= '2024-01-01' LIMIT 100000; SELECT 'Long transaction started - keeping it open...' AS status;"]]{{RUN}}

**Monitor incident impact**:
```sql
-- Check for blocked queries in another session
SELECT 
    pid,
    state,
    EXTRACT(EPOCH FROM (now() - query_start)) AS duration_seconds,
    LEFT(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state IN ('active', 'idle in transaction')
ORDER BY duration_seconds DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT pid, state, EXTRACT(EPOCH FROM (now() - query_start)) AS duration_seconds, LEFT(query, 100) AS query_preview FROM pg_stat_activity WHERE state IN ('active', 'idle in transaction') ORDER BY duration_seconds DESC LIMIT 10;"]]{{RUN}}

**Identify blocking locks**:
```sql
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_query,
    blocking_activity.query AS blocking_query,
    blocked_locks.mode AS lock_mode,
    EXTRACT(EPOCH FROM (now() - blocked_activity.query_start)) AS wait_time_seconds
FROM pg_catalog.pg_locks blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;
```

[[gsql -d postgres -p 5432 -c "SELECT blocked_locks.pid AS blocked_pid, blocking_activity.usename AS blocking_user, blocked_activity.query AS blocked_query, blocking_activity.query AS blocking_query, blocked_locks.mode AS lock_mode, EXTRACT(EPOCH FROM (now() - blocked_activity.query_start)) AS wait_time_seconds FROM pg_catalog.pg_locks blocked_locks JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid WHERE NOT blocked_locks.GRANTED;"]]{{RUN}}

**Resolve incident**:
```sql
-- Rollback the blocking transaction
ROLLBACK;

-- Verify resolution
SELECT 
    pid,
    state,
    EXTRACT(EPOCH FROM (now() - query_start)) AS duration_seconds
FROM pg_stat_activity
WHERE state IN ('active', 'idle in transaction')
ORDER BY duration_seconds DESC
LIMIT 5;

-- Check system recovery
SELECT * FROM monitoring.performance_dashboard;
```

[[gsql -d postgres -p 5432 -c "ROLLBACK; SELECT pid, state, EXTRACT(EPOCH FROM (now() - query_start)) AS duration_seconds FROM pg_stat_activity WHERE state IN ('active', 'idle in transaction') ORDER BY duration_seconds DESC LIMIT 5; SELECT * FROM monitoring.performance_dashboard;"]]{{RUN}}

**Create incident resolution procedure**:
```sql
CREATE TABLE monitoring.incident_log (
    incident_id SERIAL PRIMARY KEY,
    incident_type VARCHAR(50),
    incident_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20),
    description TEXT,
    resolution_time TIMESTAMP,
    resolution_steps TEXT,
    lessons_learned TEXT
);

-- Log this incident
INSERT INTO monitoring.incident_log (
    incident_type,
    severity,
    description,
    resolution_steps
) VALUES (
    'blocking_locks',
    'CRITICAL',
    'Long-running transaction causing lock contention and query blocking',
    '1. Identified blocked queries in pg_stat_activity
2. Found blocking transaction using pg_locks
3. Rolled back blocking transaction
4. Verified system recovery
5. Implemented transaction timeout monitoring'
);

SELECT * FROM monitoring.incident_log ORDER BY incident_id DESC LIMIT 1;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE monitoring.incident_log (incident_id SERIAL PRIMARY KEY, incident_type VARCHAR(50), incident_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, severity VARCHAR(20), description TEXT, resolution_time TIMESTAMP, resolution_steps TEXT, lessons_learned TEXT); INSERT INTO monitoring.incident_log (incident_type, severity, description, resolution_steps) VALUES ('blocking_locks', 'CRITICAL', 'Long-running transaction causing lock contention and query blocking', '1. Identified blocked queries in pg_stat_activity 2. Found blocking transaction using pg_locks 3. Rolled back blocking transaction 4. Verified system recovery 5. Implemented transaction timeout monitoring'); SELECT * FROM monitoring.incident_log ORDER BY incident_id DESC LIMIT 1;"]]{{RUN}}

**What to observe**:
- Blocking transactions cascade impact entire system
- Lock analysis identifies root cause
- Prompt resolution minimizes impact
- Incident logging improves future response

---

### Task 4: Advanced Index Strategy

Design and implement comprehensive index strategy for production workload.

**Analyze index effectiveness**:
```sql
-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END AS usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename = 'orders_prod'
ORDER BY idx_scan;
```

[[gsql -d postgres -p 5432 -c "SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size, CASE WHEN idx_scan = 0 THEN 'UNUSED' WHEN idx_scan < 100 THEN 'LOW_USAGE' WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE' ELSE 'HIGH_USAGE' END AS usage_level FROM pg_stat_user_indexes WHERE schemaname = 'public' AND tablename = 'orders_prod' ORDER BY idx_scan;"]]{{RUN}}

**Identify missing indexes**:
```sql
-- Find columns frequently used in WHERE clauses without indexes
SELECT 
    schemaname,
    tablename,
    attname AS column_name,
    n_distinct AS distinct_values,
    null_frac AS null_fraction,
    correlation AS column_correlation
FROM pg_stats
WHERE schemaname = 'public'
    AND tablename IN ('orders_prod')
    AND (n_distinct > 100 OR null_frac > 0.5)
ORDER BY n_distinct DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT schemaname, tablename, attname AS column_name, n_distinct AS distinct_values, null_frac AS null_fraction, correlation AS column_correlation FROM pg_stats WHERE schemaname = 'public' AND tablename IN ('orders_prod') AND (n_distinct > 100 OR null_frac > 0.5) ORDER BY n_distinct DESC;"]]{{RUN}}

**Create optimized index strategy**:
```sql
-- Functional index for computed expressions
CREATE INDEX idx_orders_prod_month_year 
ON orders_prod(DATE_TRUNC('month', order_date), DATE_TRUNC('year', order_date));

-- Hash index for equality-heavy columns
CREATE INDEX idx_orders_prod_status_hash 
ON orders_prod USING HASH (status);

-- Partial indexes for hot data
CREATE INDEX idx_orders_prod_recent 
ON orders_prod(order_date, amount, customer_id)
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX idx_orders_prod_priority 
ON orders_prod(priority, order_date)
WHERE priority <= 3;

-- Analyze index effectiveness
SELECT 
    indexname,
    idx_scan,
    idx_tup_read,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename = 'orders_prod'
ORDER BY idx_scan DESC;
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_orders_prod_month_year ON orders_prod(DATE_TRUNC('month', order_date), DATE_TRUNC('year', order_date)); CREATE INDEX idx_orders_prod_status_hash ON orders_prod USING HASH (status); CREATE INDEX idx_orders_prod_recent ON orders_prod(order_date, amount, customer_id) WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'; CREATE INDEX idx_orders_prod_priority ON orders_prod(priority, order_date) WHERE priority <= 3; SELECT indexname, idx_scan, idx_tup_read, pg_size_pretty(pg_relation_size(indexrelid)) AS size FROM pg_stat_user_indexes WHERE schemaname = 'public' AND tablename = 'orders_prod' ORDER BY idx_scan DESC;"]]{{RUN}}

**Test index effectiveness**:
```sql
-- Test query before and after optimization
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    customer_id,
    COUNT(*) AS order_count,
    SUM(amount) AS total_spent
FROM orders_prod
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
    AND status = 'delivered'
GROUP BY customer_id
ORDER BY total_spent DESC
LIMIT 100;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (ANALYZE, BUFFERS) SELECT customer_id, COUNT(*) AS order_count, SUM(amount) AS total_spent FROM orders_prod WHERE order_date >= CURRENT_DATE - INTERVAL '30 days' AND status = 'delivered' GROUP BY customer_id ORDER BY total_spent DESC LIMIT 100;"]]{{RUN}}

**What to observe**:
- Unused indexes waste storage and slow writes
- Partial indexes reduce size for hot data
- Hash indexes optimize equality operations
- Functional indexes support computed columns

---

### Task 5: Memory and Resource Optimization

Optimize memory configuration for production workload at scale.

**Analyze current memory usage**:
```sql
SELECT 
    (SELECT setting::bigint * 1024 * 1024 FROM pg_settings WHERE name = 'shared_buffers') AS shared_buffers_bytes,
    (SELECT setting::bigint * 1024 * 1024 FROM pg_settings WHERE name = 'work_mem') AS work_mem_bytes,
    (SELECT setting::bigint * 1024 * 1024 FROM pg_settings WHERE name = 'maintenance_work_mem') AS maintenance_work_mem_bytes,
    (SELECT setting::bigint * 1024 * 1024 FROM pg_settings WHERE name = 'effective_cache_size') AS effective_cache_size_bytes;
```

[[gsql -d postgres -p 5432 -c "SELECT (SELECT setting::bigint * 1024 * 1024 FROM pg_settings WHERE name = 'shared_buffers') AS shared_buffers_bytes, (SELECT setting::bigint * 1024 * 1024 FROM pg_settings WHERE name = 'work_mem') AS work_mem_bytes, (SELECT setting::bigint * 1024 * 1024 FROM pg_settings WHERE name = 'maintenance_work_mem') AS maintenance_work_mem_bytes, (SELECT setting::bigint * 1024 * 1024 FROM pg_settings WHERE name = 'effective_cache_size') AS effective_cache_size_bytes;"]]{{RUN}}

**Monitor memory pressure**:
```sql
-- Check for temporary file usage (indicates memory pressure)
SELECT 
    spcname,
    pg_size_pretty(pg_tablespace_size(spcname)) AS size,
    (SELECT COUNT(*) FROM pg_statio_user_tables WHERE temp_tablespace = spcname) AS temp_tables
FROM pg_tablespace
WHERE spcname LIKE 'pg_temp%';
```

[[gsql -d postgres -p 5432 -c "SELECT spcname, pg_size_pretty(pg_tablespace_size(spcname)) AS size, (SELECT COUNT(*) FROM pg_statio_user_tables WHERE temp_tablespace = spcname) AS temp_tables FROM pg_tablespace WHERE spcname LIKE 'pg_temp%';"]]{{RUN}}

**Optimize memory parameters**:
```sql
-- Tune work_mem for large sorts
SET work_mem = '256MB';

-- Tune maintenance_work_mem for large operations
SET maintenance_work_mem = '512MB';

-- Test with memory-intensive query
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    customer_id,
    product_id,
    ARRAY_AGG(order_id) AS order_ids,
    SUM(amount) AS total_amount,
    COUNT(*) AS order_count,
    STDDEV(amount) AS amount_stddev,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_amount
FROM orders_prod
WHERE order_date >= '2024-01-01'
GROUP BY customer_id, product_id
HAVING COUNT(*) > 5
ORDER BY total_amount DESC
LIMIT 1000;
```

[[gsql -d postgres -p 5432 -c "SET work_mem = '256MB'; SET maintenance_work_mem = '512MB'; EXPLAIN (ANALYZE, BUFFERS) SELECT customer_id, product_id, ARRAY_AGG(order_id) AS order_ids, SUM(amount) AS total_amount, COUNT(*) AS order_count, STDDEV(amount) AS amount_stddev, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_amount FROM orders_prod WHERE order_date >= '2024-01-01' GROUP BY customer_id, product_id HAVING COUNT(*) > 5 ORDER BY total_amount DESC LIMIT 1000;"]]{{RUN}}

**Check for external sorts (disk spills)**:
```sql
SELECT 
    schemaname,
    relname,
    temp_blks_read,
    temp_blks_written,
    CASE 
        WHEN temp_blks_read > 0 OR temp_blks_written > 0 THEN 'DISK_SPILL'
        ELSE 'IN_MEMORY'
    END AS sort_type
FROM pg_statio_user_tables
WHERE schemaname = 'public'
    AND (temp_blks_read > 0 OR temp_blks_written > 0)
ORDER BY (temp_blks_read + temp_blks_written) DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT schemaname, relname, temp_blks_read, temp_blks_written, CASE WHEN temp_blks_read > 0 OR temp_blks_written > 0 THEN 'DISK_SPILL' ELSE 'IN_MEMORY' END AS sort_type FROM pg_statio_user_tables WHERE schemaname = 'public' AND (temp_blks_read > 0 OR temp_blks_written > 0) ORDER BY (temp_blks_read + temp_blks_written) DESC;"]]{{RUN}}

**What to observe**:
- Higher work_mem prevents disk spills
- Disk spills significantly slow queries
- Memory optimization reduces I/O
- Monitor temp file usage for memory pressure

---

### Task 6: Query Plan Analysis and Optimization

Deep dive into query plans for advanced optimization.

**Force specific plan with hints**:
```sql
-- Test different join strategies
SET enable_hashjoin = off;
SET enable_mergejoin = off;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    o.order_id,
    o.customer_id,
    o.amount,
    p.product_name
FROM orders_prod o
JOIN products p ON o.product_id = p.product_id
WHERE o.order_date >= '2024-06-01'
ORDER BY o.amount DESC
LIMIT 1000;

-- Enable hash joins
SET enable_hashjoin = on;

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    o.order_id,
    o.customer_id,
    o.amount,
    p.product_name
FROM orders_prod o
JOIN products p ON o.product_id = p.product_id
WHERE o.order_date >= '2024-06-01'
ORDER BY o.amount DESC
LIMIT 1000;
```

[[gsql -d postgres -p 5432 -c "SET enable_hashjoin = off; SET enable_mergejoin = off; EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT o.order_id, o.customer_id, o.amount, p.product_name FROM orders_prod o JOIN products p ON o.product_id = p.product_id WHERE o.order_date >= '2024-06-01' ORDER BY o.amount DESC LIMIT 1000; SET enable_hashjoin = on; EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT o.order_id, o.customer_id, o.amount, p.product_name FROM orders_prod o JOIN products p ON o.product_id = p.product_id WHERE o.order_date >= '2024-06-01' ORDER BY o.amount DESC LIMIT 1000;"]]{{RUN}}

**Analyze complex nested loop issues**:
```sql
-- Check for costly nested loops
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
    o1.order_id,
    o1.amount,
    o2.order_id AS related_order,
    o2.amount AS related_amount,
    o3.order_id AS third_order,
    o3.amount AS third_amount
FROM orders_prod o1
LEFT JOIN orders_prod o2 ON o1.customer_id = o2.customer_id 
    AND o2.order_id > o1.order_id
LEFT JOIN orders_prod o3 ON o1.product_id = o3.product_id
    AND o3.order_id > o2.order_id
WHERE o1.order_date >= '2024-06-01'
LIMIT 100;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT o1.order_id, o1.amount, o2.order_id AS related_order, o2.amount AS related_amount, o3.order_id AS third_order, o3.amount AS third_amount FROM orders_prod o1 LEFT JOIN orders_prod o2 ON o1.customer_id = o2.customer_id AND o2.order_id > o1.order_id LEFT JOIN orders_prod o3 ON o1.product_id = o3.product_id AND o3.order_id > o2.order_id WHERE o1.order_date >= '2024-06-01' LIMIT 100;"]]{{RUN}}

**Optimize with subqueries and CTEs**:
```sql
-- Rewrite using LATERAL joins
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    o.order_id,
    o.amount,
    customer_stats.total_customer_orders,
    customer_stats.customer_avg_amount,
    product_stats.total_product_orders,
    product_stats.product_avg_amount
FROM orders_prod o
CROSS JOIN LATERAL (
    SELECT 
        COUNT(*) AS total_customer_orders,
        AVG(amount) AS customer_avg_amount
    FROM orders_prod o2
    WHERE o2.customer_id = o.customer_id
        AND o2.order_date >= '2024-01-01'
) customer_stats
CROSS JOIN LATERAL (
    SELECT 
        COUNT(*) AS total_product_orders,
        AVG(amount) AS product_avg_amount
    FROM orders_prod o3
    WHERE o3.product_id = o.product_id
        AND o3.order_date >= '2024-01-01'
) product_stats
WHERE o.order_date >= '2024-06-01'
LIMIT 100;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (ANALYZE, BUFFERS) SELECT o.order_id, o.amount, customer_stats.total_customer_orders, customer_stats.customer_avg_amount, product_stats.total_product_orders, product_stats.product_avg_amount FROM orders_prod o CROSS JOIN LATERAL (SELECT COUNT(*) AS total_customer_orders, AVG(amount) AS customer_avg_amount FROM orders_prod o2 WHERE o2.customer_id = o.customer_id AND o2.order_date >= '2024-01-01') customer_stats CROSS JOIN LATERAL (SELECT COUNT(*) AS total_product_orders, AVG(amount) AS product_avg_amount FROM orders_prod o3 WHERE o3.product_id = o.product_id AND o3.order_date >= '2024-01-01') product_stats WHERE o.order_date >= '2024-06-01' LIMIT 100;"]]{{RUN}}

**What to observe**:
- Different join methods have different costs
- Nested loops can be expensive for large datasets
- LATERAL joins optimize subqueries
- Query hints force specific plans for testing

---

### Task 7: Production Optimization Strategy

Develop comprehensive optimization strategy for production deployment.

**Create optimization recommendations**:
```sql
CREATE TABLE optimization_recommendations (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50),
    issue TEXT,
    recommendation TEXT,
    expected_improvement TEXT,
    priority INT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analyze current state and create recommendations
INSERT INTO optimization_recommendations (category, issue, recommendation, expected_improvement, priority)
VALUES
('Indexing', 'Multiple unused indexes detected', 'DROP unused indexes: idx_orders_prod_unsused1, idx_orders_prod_unsused2', 'Reduced storage and faster writes', 3),
('Memory', 'High disk spill rate detected', 'Increase work_mem to 256MB for large sorts', '30-50% faster large queries', 2),
('Query Optimization', 'Expensive nested loop joins in production', 'Rewrite queries to use LATERAL joins or explicit JOIN conditions', '50-70% faster complex queries', 1),
('Caching', 'Cache hit ratio below optimal', 'Increase shared_buffers to 8GB based on available memory', 'Improved read performance by 20-30%', 2),
('Partitioning', 'Old partitions not pruned effectively', 'Add partition key column to WHERE clauses in common queries', '80-90% faster date-range queries', 1);

SELECT * FROM optimization_recommendations ORDER BY priority, created_at;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE optimization_recommendations (id SERIAL PRIMARY KEY, category VARCHAR(50), issue TEXT, recommendation TEXT, expected_improvement TEXT, priority INT, status VARCHAR(20) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO optimization_recommendations (category, issue, recommendation, expected_improvement, priority) VALUES ('Indexing', 'Multiple unused indexes detected', 'DROP unused indexes: idx_orders_prod_unsused1, idx_orders_prod_unsused2', 'Reduced storage and faster writes', 3), ('Memory', 'High disk spill rate detected', 'Increase work_mem to 256MB for large sorts', '30-50% faster large queries', 2), ('Query Optimization', 'Expensive nested loop joins in production', 'Rewrite queries to use LATERAL joins or explicit JOIN conditions', '50-70% faster complex queries', 1), ('Caching', 'Cache hit ratio below optimal', 'Increase shared_buffers to 8GB based on available memory', 'Improved read performance by 20-30%', 2), ('Partitioning', 'Old partitions not pruned effectively', 'Add partition key column to WHERE clauses in common queries', '80-90% faster date-range queries', 1); SELECT * FROM optimization_recommendations ORDER BY priority, created_at;"]]{{RUN}}

**Create performance baseline for tracking**:
```sql
CREATE TABLE performance_baseline (
    baseline_id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    database_size_gb NUMERIC(10, 2),
    cache_hit_ratio NUMERIC(5, 2),
    avg_query_time_ms NUMERIC(10, 2),
    active_connections INT,
    blocked_queries INT,
    replication_lag_ms INT,
    notes TEXT
);

-- Record current baseline
INSERT INTO performance_baseline (
    database_size_gb,
    cache_hit_ratio,
    avg_query_time_ms,
    active_connections,
    blocked_queries,
    replication_lag_ms,
    notes
)
SELECT 
    pg_database_size(current_database)::NUMERIC / 1024 / 1024 / 1024 / 1024,
    (SELECT SUM(heap_blks_hit) * 100.0 / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0) FROM pg_statio_user_tables),
    (SELECT AVG(EXTRACT(EPOCH FROM (now() - query_start))) * 1000 FROM pg_stat_activity WHERE state = 'active'),
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'),
    (SELECT COUNT(*) FROM pg_locks WHERE NOT granted),
    (SELECT AVG(replay_lag)::INT FROM pg_stat_replication),
    'Initial baseline established during L4 lab'
FROM (SELECT 1) AS dummy;

SELECT * FROM performance_baseline;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE performance_baseline (baseline_id SERIAL PRIMARY KEY, recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, database_size_gb NUMERIC(10, 2), cache_hit_ratio NUMERIC(5, 2), avg_query_time_ms NUMERIC(10, 2), active_connections INT, blocked_queries INT, replication_lag_ms INT, notes TEXT); INSERT INTO performance_baseline (database_size_gb, cache_hit_ratio, avg_query_time_ms, active_connections, blocked_queries, replication_lag_ms, notes) SELECT pg_database_size(current_database)::NUMERIC / 1024 / 1024 / 1024 / 1024, (SELECT SUM(heap_blks_hit) * 100.0 / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0) FROM pg_statio_user_tables), (SELECT AVG(EXTRACT(EPOCH FROM (now() - query_start))) * 1000 FROM pg_stat_activity WHERE state = 'active'), (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'), (SELECT COUNT(*) FROM pg_locks WHERE NOT granted), (SELECT AVG(replay_lag)::INT FROM pg_stat_replication), 'Initial baseline established during L4 lab' FROM (SELECT 1) AS dummy; SELECT * FROM performance_baseline;"]]{{RUN}}

**What to observe**:
- Recommendations prioritize based on impact
- Baselines enable before/after comparison
- Tracking improvements validates optimization
- Strategy must consider production constraints

---

### Task 8: Clean Up Test Environment

**Drop test tables and schemas**:
```sql
-- Drop monitoring schema
DROP SCHEMA monitoring CASCADE;

-- Drop production test tables
DROP TABLE IF EXISTS orders_prod CASCADE;
DROP TABLE IF EXISTS orders_monthly_summary CASCADE;
DROP TABLE IF EXISTS optimization_recommendations CASCADE;
DROP TABLE IF EXISTS performance_baseline CASCADE;

-- Drop products table if created
DROP TABLE IF EXISTS products CASCADE;
```

[[gsql -d postgres -p 5432 -c "DROP SCHEMA monitoring CASCADE; DROP TABLE IF EXISTS orders_prod CASCADE; DROP TABLE IF EXISTS orders_monthly_summary CASCADE; DROP TABLE IF EXISTS optimization_recommendations CASCADE; DROP TABLE IF EXISTS performance_baseline CASCADE; DROP TABLE IF EXISTS products CASCADE;"]]{{RUN}}

**Verify cleanup**:
```sql
-- Check remaining objects
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check schemas
SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema' ORDER BY nspname;
```

[[gsql -d postgres -p 5432 -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename; SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema' ORDER BY nspname;"]]{{RUN}}

**What to observe**:
- Clean environment prevents resource waste
- Remove test data before production deployment
- Proper cleanup maintains database health

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Diagnosed complex performance issues
- [ ] Task 2: Implemented real-time performance monitoring
- [ ] Task 3: Resolved production incident scenario
- [ ] Task 4: Designed advanced index strategy
- [ ] Task 5: Optimized memory and resources
- [ ] Task 6: Analyzed query plans deeply
- [ ] Task 7: Developed optimization strategy
- [ ] Task 8: Cleaned up test environment

## Review Questions

1. **What is key to production performance tuning?**
   - [ ] Focus only on individual queries
   - [ ] Comprehensive monitoring and systematic approach
   - [ ] Increase all memory parameters
   - [ ] Remove all indexes

2. **How to handle production incidents?**
   - [ ] Restart database immediately
   - [ ] Analyze root cause, targeted resolution, document
   - [ ] Kill all long-running queries
   - [ ] Ignore until resolved

3. **What indicates memory pressure?**
   - [ ] High cache hit ratio
   - [ ] Temporary file usage and disk spills
   - [ ] Fast query execution
   - [ ] Low connection count

4. **When are materialized views useful?**
   - [ ] For frequently changing data
   - [ ] For pre-aggregated summary data
   - [ ] For single-row queries
   - [ ] Always use them

## Summary

In this L4 lab, you practiced:
- **Complex Diagnosis**: Multi-dimensional performance issue resolution
- **Real-Time Monitoring**: Comprehensive dashboard and alerting
- **Incident Response**: Systematic incident resolution
- **Advanced Indexing**: Strategic index design
- **Memory Optimization**: Resource tuning and pressure monitoring
- **Query Analysis**: Deep plan analysis and optimization
- **Strategy Development**: Production optimization planning

These expert-level techniques enable you to manage and optimize performance in production-grade GaussDB deployments at scale.

## Completion

Congratulations! You have completed all L4 labs in the MGCA course. You now have expert-level knowledge in:
- Architecture optimization
- Performance tuning at scale
- SQL development best practices
- Advanced backup and recovery
- High availability configuration
- Security at scale
- Installation and configuration

You are prepared to handle complex, production-grade challenges in GaussDB environments.
