# Performance Tuning Module - L2 Lab: Query Optimization

## Lab Overview

In this L2 (Intermediate Level) lab, you will practice query optimization techniques in GaussDB, including:
- Using EXPLAIN to analyze query plans
- Identifying inefficient queries
- Creating and managing indexes
- Optimizing query performance

**Time Required**: 40 minutes
**Prerequisites**: Completed L1 Performance Tuning Lab, test data in database

## Learning Objectives

By completing this lab, you will be able to:
- Read and understand EXPLAIN output
- Identify query performance bottlenecks
- Create effective indexes
- Optimize queries for better performance

## Lab Tasks

### Task 1: Analyze Query Execution Plans

Let's use EXPLAIN to understand how GaussDB executes queries.

**Create test data for optimization**:
```sql
CREATE TABLE performance_test (
    id INT,
    category_id INT,
    value1 NUMERIC(10, 2),
    value2 NUMERIC(10, 2),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO performance_test 
SELECT 
    generate_series(1, 10000),
    (random() * 100)::INT,
    (random() * 1000)::NUMERIC(10, 2),
    (random() * 500)::NUMERIC(10, 2),
    (CASE WHEN random() > 0.5 THEN 'active' ELSE 'inactive' END),
    CURRENT_TIMESTAMP - (random() * 365 * INTERVAL '1 day')
FROM generate_series(1, 10000);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE performance_test (id INT, category_id INT, value1 NUMERIC(10, 2), value2 NUMERIC(10, 2), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO performance_test SELECT generate_series(1, 10000), (random() * 100)::INT, (random() * 1000)::NUMERIC(10, 2), (random() * 500)::NUMERIC(10, 2), (CASE WHEN random() > 0.5 THEN 'active' ELSE 'inactive' END), CURRENT_TIMESTAMP - (random() * 365 * INTERVAL '1 day') FROM generate_series(1, 10000);"]]{{RUN}}

**Analyze simple query plan**:
```sql
EXPLAIN SELECT * FROM performance_test WHERE category_id = 50;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN SELECT * FROM performance_test WHERE category_id = 50;"]]{{RUN}}

**What to observe**:
- **Seq Scan**: Sequential table scan (slow for large tables)
- **Index Scan**: Uses index (fast)
- **Bitmap Heap Scan**: Combines multiple index scans
- **Cost**: Estimated execution cost (lower is better)

**Analyze query with actual execution**:
```sql
EXPLAIN ANALYZE SELECT * FROM performance_test WHERE category_id = 50;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT * FROM performance_test WHERE category_id = 50;"]]{{RUN}}

**What to observe**:
- **actual time**: Actual execution time
- **actual rows**: Number of rows processed
- Compare estimated vs actual for accuracy

---

### Task 2: Create Indexes and Re-analyze

Let's create indexes and see how plans change.

**Create index on category_id**:
```sql
CREATE INDEX idx_perf_category ON performance_test(category_id);
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_perf_category ON performance_test(category_id);"]]{{RUN}}

**Analyze query plan with index**:
```sql
EXPLAIN SELECT * FROM performance_test WHERE category_id = 50;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN SELECT * FROM performance_test WHERE category_id = 50;"]]{{RUN}}

**What to observe**:
- Should now show "Index Scan" instead of "Seq Scan"
- Query cost should be significantly lower

**Create composite index**:
```sql
CREATE INDEX idx_perf_category_status ON performance_test(category_id, status);
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_perf_category_status ON performance_test(category_id, status);"]]{{RUN}}

**Analyze query with composite index**:
```sql
EXPLAIN 
SELECT * FROM performance_test 
WHERE category_id = 50 
    AND status = 'active';
```

[[gsql -d postgres -p 5432 -c "EXPLAIN SELECT * FROM performance_test WHERE category_id = 50 AND status = 'active';"]]{{RUN}}

**What to observe**:
- Composite index covers both conditions
- Single index scan instead of filtering after scan

---

### Task 3: Identify Slow Queries

Let's find slow queries in the system.

**Check pg_stat_statements for slow queries**:
```sql
SELECT 
    calls AS query_calls,
    total_exec_time AS total_time_ms,
    mean_exec_time AS avg_time_ms,
    max_exec_time AS max_time_ms,
    left(query, 100) AS query_preview
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT calls AS query_calls, total_exec_time AS total_time_ms, mean_exec_time AS avg_time_ms, max_exec_time AS max_time_ms, left(query, 100) AS query_preview FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"]]{{RUN}}

**What to observe**:
- **calls**: Number of times query executed
- **mean_exec_time**: Average execution time
- High mean or max times indicate slow queries

**Check for queries with high total time**:
```sql
SELECT 
    calls,
    total_exec_time AS total_time_ms,
    mean_exec_time AS avg_time_ms,
    rows,
    left(query, 100) AS query_preview
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT calls, total_exec_time AS total_time_ms, mean_exec_time AS avg_time_ms, rows, left(query, 100) AS query_preview FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"]]{{RUN}}

**What to observe**:
- Frequently called queries with high total time
- These are good candidates for optimization

---

### Task 4: Optimize JOIN Queries

Let's optimize queries that use JOINs.

**Create two tables for join testing**:
```sql
CREATE TABLE orders_perf (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    amount NUMERIC(10, 2)
);

CREATE TABLE order_lines_perf (
    line_id INT PRIMARY KEY,
    order_id INT REFERENCES orders_perf(order_id),
    product_id INT,
    quantity INT,
    price NUMERIC(10, 2)
);

INSERT INTO orders_perf 
SELECT generate_series(1, 1000),
    (random() * 100)::INT,
    CURRENT_DATE - (random() * 365)::INT,
    (random() * 1000)::NUMERIC(10, 2);

INSERT INTO order_lines_perf 
SELECT generate_series(1, 5000),
    (random() * 1000)::INT,
    (random() * 1000)::INT,
    (random() * 10 + 1)::INT,
    (random() * 100)::NUMERIC(10, 2);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE orders_perf (order_id INT PRIMARY KEY, customer_id INT, order_date DATE, amount NUMERIC(10, 2)); CREATE TABLE order_lines_perf (line_id INT PRIMARY KEY, order_id INT REFERENCES orders_perf(order_id), product_id INT, quantity INT, price NUMERIC(10, 2)); INSERT INTO orders_perf SELECT generate_series(1, 1000), (random() * 100)::INT, CURRENT_DATE - (random() * 365)::INT, (random() * 1000)::NUMERIC(10, 2); INSERT INTO order_lines_perf SELECT generate_series(1, 5000), (random() * 1000)::INT, (random() * 1000)::INT, (random() * 10 + 1)::INT, (random() * 100)::NUMERIC(10, 2);"]]{{RUN}}

**Analyze slow join query**:
```sql
EXPLAIN ANALYZE
SELECT 
    o.order_id,
    o.order_date,
    o.amount,
    count(*) AS line_count
FROM orders_perf o
JOIN order_lines_perf l ON o.order_id = l.order_id
WHERE o.order_date > '2025-01-01'
GROUP BY o.order_id, o.order_date, o.amount;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT o.order_id, o.order_date, o.amount, count(*) AS line_count FROM orders_perf o JOIN order_lines_perf l ON o.order_id = l.order_id WHERE o.order_date > '2025-01-01' GROUP BY o.order_id, o.order_date, o.amount;"]]{{RUN}}

**Create index on order_date**:
```sql
CREATE INDEX idx_orders_date ON orders_perf(order_date);
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_orders_date ON orders_perf(order_date);"]]{{RUN}}

**Re-analyze join query**:
```sql
EXPLAIN ANALYZE
SELECT 
    o.order_id,
    o.order_date,
    o.amount,
    count(*) AS line_count
FROM orders_perf o
JOIN order_lines_perf l ON o.order_id = l.order_id
WHERE o.order_date > '2025-01-01'
GROUP BY o.order_id, o.order_date, o.amount;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT o.order_id, o.order_date, o.amount, count(*) AS line_count FROM orders_perf o JOIN order_lines_perf l ON o.order_id = l.order_id WHERE o.order_date > '2025-01-01' GROUP BY o.order_id, o.order_date, o.amount;"]]{{RUN}}

**What to observe**:
- Index on order_date should speed up WHERE clause
- Check if query cost decreased after adding index

---

### Task 5: Optimize Aggregation Queries

Let's optimize queries that use aggregations.

**Find slow aggregation query**:
```sql
EXPLAIN ANALYZE
SELECT 
    category_id,
    count(*) AS row_count,
    avg(value1) AS avg_value,
    sum(value2) AS total_value
FROM performance_test
WHERE status = 'active'
GROUP BY category_id;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT category_id, count(*) AS row_count, avg(value1) AS avg_value, sum(value2) AS total_value FROM performance_test WHERE status = 'active' GROUP BY category_id;"]]{{RUN}}

**Create partial index for active status**:
```sql
CREATE INDEX idx_perf_active 
ON performance_test(status) 
WHERE status = 'active';
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_perf_active ON performance_test(status) WHERE status = 'active';"]]{{RUN}}

**Re-analyze aggregation query**:
```sql
EXPLAIN ANALYZE
SELECT 
    category_id,
    count(*) AS row_count,
    avg(value1) AS avg_value,
    sum(value2) AS total_value
FROM performance_test
WHERE status = 'active'
GROUP BY category_id;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT category_id, count(*) AS row_count, avg(value1) AS avg_value, sum(value2) AS total_value FROM performance_test WHERE status = 'active' GROUP BY category_id;"]]{{RUN}}

**What to observe**:
- Partial index is smaller and faster for specific status values
- Good for columns with skewed distributions

---

### Task 6: Use CTEs for Optimization

Let's optimize complex queries using Common Table Expressions.

**Compare query with and without CTE**:
```sql
-- Without CTE
EXPLAIN ANALYZE
SELECT 
    p.id,
    p.category_id,
    p.value1,
    (SELECT avg(value1) FROM performance_test WHERE category_id = p.category_id) AS category_avg
FROM performance_test p
WHERE p.status = 'active'
LIMIT 100;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT p.id, p.category_id, p.value1, (SELECT avg(value1) FROM performance_test WHERE category_id = p.category_id) AS category_avg FROM performance_test p WHERE p.status = 'active' LIMIT 100;"]]{{RUN}}

```sql
-- With CTE
EXPLAIN ANALYZE
WITH category_averages AS (
    SELECT category_id, avg(value1) AS avg_val
    FROM performance_test
    GROUP BY category_id
)
SELECT 
    p.id,
    p.category_id,
    p.value1,
    ca.avg_val AS category_avg
FROM performance_test p
JOIN category_averages ca ON p.category_id = ca.category_id
WHERE p.status = 'active'
LIMIT 100;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE WITH category_averages AS (SELECT category_id, avg(value1) AS avg_val FROM performance_test GROUP BY category_id) SELECT p.id, p.category_id, p.value1, ca.avg_val AS category_avg FROM performance_test p JOIN category_averages ca ON p.category_id = ca.category_id WHERE p.status = 'active' LIMIT 100;"]]{{RUN}}

**What to observe**:
- CTE version may be more efficient (executes subquery once)
- Check actual execution times

---

### Task 7: Analyze and Update Statistics

Let's understand the importance of statistics.

**Check table statistics**:
```sql
SELECT 
    relname AS table_name,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    last_vacuum AS last_vacuum_time,
    last_autovacuum AS last_autovacuum_time,
    last_analyze AS last_analyze_time,
    last_autoanalyze AS last_autoanalyze_time
FROM pg_stat_user_tables
WHERE relname = 'performance_test';
```

[[gsql -d postgres -p 5432 -c "SELECT relname AS table_name, n_live_tup AS live_rows, n_dead_tup AS dead_rows, last_vacuum AS last_vacuum_time, last_autovacuum AS last_autovacuum_time, last_analyze AS last_analyze_time, last_autoanalyze AS last_autoanalyze_time FROM pg_stat_user_tables WHERE relname = 'performance_test';"]]{{RUN}}

**Manually analyze table**:
```sql
ANALYZE performance_test;
```

[[gsql -d postgres -p 5432 -c "ANALYZE performance_test;"]]{{RUN}}

**Update table statistics**:
```sql
INSERT INTO performance_test 
SELECT generate_series(10001, 11000),
    (random() * 100)::INT,
    (random() * 1000)::NUMERIC(10, 2),
    (random() * 500)::NUMERIC(10, 2),
    'new',
    CURRENT_TIMESTAMP;
```

[[gsql -d postgres -p 5432 -c "INSERT INTO performance_test SELECT generate_series(10001, 11000), (random() * 100)::INT, (random() * 1000)::NUMERIC(10, 2), (random() * 500)::NUMERIC(10, 2), 'new', CURRENT_TIMESTAMP;"]]{{RUN}}

**Re-analyze query with updated statistics**:
```sql
EXPLAIN ANALYZE SELECT * FROM performance_test WHERE category_id = 50 LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT * FROM performance_test WHERE category_id = 50 LIMIT 10;"]]{{RUN}}

**What to observe**:
- Updated statistics improve query planner accuracy
- Estimated vs actual rows should be closer

---

### Task 8: Clean Up Test Data

Let's clean up the test tables we created.

**Drop test tables**:
```sql
DROP TABLE performance_test;
DROP TABLE orders_perf;
DROP TABLE order_lines_perf;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE performance_test; DROP TABLE orders_perf; DROP TABLE order_lines_perf;"]]{{RUN}}

**Verify cleanup**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

[[gsql -d postgres -p 5432 -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Analyzed query execution plans with EXPLAIN
- [ ] Task 2: Created indexes and compared query plans
- [ ] Task 3: Identified slow queries using pg_stat_statements
- [ ] Task 4: Optimized JOIN queries with proper indexes
- [ ] Task 5: Optimized aggregation queries
- [ ] Task 6: Used CTEs for query optimization
- [ ] Task 7: Updated statistics and analyzed impact
- [ ] Task 8: Cleaned up test data

## Review Questions

1. **What does EXPLAIN ANALYZE provide that EXPLAIN alone doesn't?**
   - [ ] Better query plans
   - [ ] Actual execution times and row counts
   - [ ] Lower query cost
   - [ ] Automatic optimization

2. **What indicates a query needs an index?**
   - [ ] High cost in EXPLAIN
   - [ ] Sequential scan on large table
   - [ ] Low cost in EXPLAIN
   - [ ] Index scan is slow

3. **What is benefit of a composite index?**
   - [ ] Faster single-column queries
   - [ ] Covers multiple columns in a single index
   - [ ] Smaller storage
   - [ ] No difference from separate indexes

4. **Why is ANALYZE important for query performance?**
   - [ ] It cleans up dead rows
   - [ ] It updates statistics for query planner
   - [ ] It creates indexes
   - [ ] It removes duplicates

## Summary

In this L2 lab, you practiced:
- **EXPLAIN Analysis**: Reading and understanding query execution plans
- **Index Creation**: Creating single, composite, and partial indexes
- **Slow Query Identification**: Using pg_stat_statements to find bottlenecks
- **Join Optimization**: Optimizing queries with JOIN operations
- **Aggregation Optimization**: Improving GROUP BY and aggregate queries
- **CTE Usage**: Using Common Table Expressions for optimization
- **Statistics Management**: Running ANALYZE to improve planner accuracy

These intermediate performance tuning techniques enable you to identify and optimize slow queries in GaussDB.

## Next Steps

Proceed to **L3 Lab** to practice advanced operations including:
- Advanced index strategies (covering indexes, BRIN, GiST, GIN)
- Query rewriting techniques
- Parallel query optimization
- Partitioning for large tables
- Advanced EXPLAIN features
