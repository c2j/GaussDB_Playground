# Performance Tuning Module - L3 Lab: Advanced Performance Optimization

## Lab Overview

In this L3 (Advanced Level) lab, you will practice advanced performance optimization techniques in GaussDB, including:
- Advanced index strategies (covering, BRIN, GiST, GIN)
- Query rewriting and optimization
- Parallel query execution
- Table partitioning for large datasets
- Advanced EXPLAIN analysis

**Time Required**: 60 minutes
**Prerequisites**: Completed L1 and L2 Performance Tuning Labs, familiarity with EXPLAIN

## Learning Objectives

By completing this lab, you will be able to:
- Implement advanced index types for specific use cases
- Rewrite queries for better performance
- Optimize parallel query execution
- Partition large tables effectively
- Use advanced EXPLAIN features for deep analysis

## Lab Tasks

### Task 1: Create Covering Indexes

Covering indexes include all columns needed for a query, eliminating table lookups.

**Create large test table**:
```sql
CREATE TABLE orders_covering (
    order_id BIGINT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    ship_date DATE,
    status VARCHAR(20),
    total_amount NUMERIC(12, 2),
    tax_amount NUMERIC(10, 2),
    discount NUMERIC(10, 2),
    region VARCHAR(20)
);

INSERT INTO orders_covering 
SELECT 
    generate_series(1, 100000),
    (random() * 500)::INT,
    CURRENT_DATE - (random() * 365)::INT,
    CURRENT_DATE - (random() * 300)::INT,
    (ARRAY['pending', 'shipped', 'delivered', 'cancelled'])[floor(random() * 4 + 1)],
    (random() * 1000)::NUMERIC(12, 2),
    (random() * 100)::NUMERIC(10, 2),
    (random() * 50)::NUMERIC(10, 2),
    (ARRAY['north', 'south', 'east', 'west'])[floor(random() * 4 + 1)];
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE orders_covering (order_id BIGINT PRIMARY KEY, customer_id INT, order_date DATE, ship_date DATE, status VARCHAR(20), total_amount NUMERIC(12, 2), tax_amount NUMERIC(10, 2), discount NUMERIC(10, 2), region VARCHAR(20)); INSERT INTO orders_covering SELECT generate_series(1, 100000), (random() * 500)::INT, CURRENT_DATE - (random() * 365)::INT, CURRENT_DATE - (random() * 300)::INT, (ARRAY['pending', 'shipped', 'delivered', 'cancelled'])[floor(random() * 4 + 1)], (random() * 1000)::NUMERIC(12, 2), (random() * 100)::NUMERIC(10, 2), (random() * 50)::NUMERIC(10, 2), (ARRAY['north', 'south', 'east', 'west'])[floor(random() * 4 + 1)];"]]{{RUN}}

**Test query without covering index**:
```sql
EXPLAIN ANALYZE
SELECT customer_id, total_amount, tax_amount, discount
FROM orders_covering
WHERE order_date BETWEEN '2025-01-01' AND '2025-12-31'
ORDER BY total_amount DESC
LIMIT 1000;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT customer_id, total_amount, tax_amount, discount FROM orders_covering WHERE order_date BETWEEN '2025-01-01' AND '2025-12-31' ORDER BY total_amount DESC LIMIT 1000;"]]{{RUN}}

**Create covering index**:
```sql
CREATE INDEX idx_orders_covering 
ON orders_covering(order_date DESC, total_amount DESC) 
INCLUDE (customer_id, tax_amount, discount);
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_orders_covering ON orders_covering(order_date DESC, total_amount DESC) INCLUDE (customer_id, tax_amount, discount);"]]{{RUN}}

**Test query with covering index**:
```sql
EXPLAIN ANALYZE
SELECT customer_id, total_amount, tax_amount, discount
FROM orders_covering
WHERE order_date BETWEEN '2025-01-01' AND '2025-12-31'
ORDER BY total_amount DESC
LIMIT 1000;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT customer_id, total_amount, tax_amount, discount FROM orders_covering WHERE order_date BETWEEN '2025-01-01' AND '2025-12-31' ORDER BY total_amount DESC LIMIT 1000;"]]{{RUN}}

**What to observe**:
- Query should show "Index Only Scan" with covering index
- No heap fetches needed
- Significant performance improvement for index-only scans

---

### Task 2: Use BRIN Index for Large Tables

BRIN (Block Range INdex) is efficient for very large tables with naturally ordered data.

**Create time-series table**:
```sql
CREATE TABLE sensor_data (
    sensor_id INT,
    timestamp TIMESTAMP,
    temperature NUMERIC(8, 2),
    humidity NUMERIC(5, 2),
    pressure NUMERIC(10, 2)
) PARTITION BY RANGE (timestamp);

-- Create 5 monthly partitions
CREATE TABLE sensor_data_2025_01 PARTITION OF sensor_data
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE sensor_data_2025_02 PARTITION OF sensor_data
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE sensor_data_2025_03 PARTITION OF sensor_data
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE sensor_data_2025_04 PARTITION OF sensor_data
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE sensor_data_2025_05 PARTITION OF sensor_data
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE sensor_data (sensor_id INT, timestamp TIMESTAMP, temperature NUMERIC(8, 2), humidity NUMERIC(5, 2), pressure NUMERIC(10, 2)) PARTITION BY RANGE (timestamp); CREATE TABLE sensor_data_2025_01 PARTITION OF sensor_data FOR VALUES FROM ('2025-01-01') TO ('2025-02-01'); CREATE TABLE sensor_data_2025_02 PARTITION OF sensor_data FOR VALUES FROM ('2025-02-01') TO ('2025-03-01'); CREATE TABLE sensor_data_2025_03 PARTITION OF sensor_data FOR VALUES FROM ('2025-03-01') TO ('2025-04-01'); CREATE TABLE sensor_data_2025_04 PARTITION OF sensor_data FOR VALUES FROM ('2025-04-01') TO ('2025-05-01'); CREATE TABLE sensor_data_2025_05 PARTITION OF sensor_data FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');"]]{{RUN}}

**Insert time-series data**:
```sql
INSERT INTO sensor_data
SELECT 
    (random() * 100)::INT,
    '2025-01-01'::timestamp + (random() * 150 * 86400)::interval,
    (random() * 40 + 10)::NUMERIC(8, 2),
    (random() * 60 + 20)::NUMERIC(5, 2),
    (random() * 200 + 900)::NUMERIC(10, 2)
FROM generate_series(1, 500000);
```

[[gsql -d postgres -p 5432 -c "INSERT INTO sensor_data SELECT (random() * 100)::INT, '2025-01-01'::timestamp + (random() * 150 * 86400)::interval, (random() * 40 + 10)::NUMERIC(8, 2), (random() * 60 + 20)::NUMERIC(5, 2), (random() * 200 + 900)::NUMERIC(10, 2) FROM generate_series(1, 500000);"]]{{RUN}}

**Create BRIN index**:
```sql
CREATE INDEX idx_sensor_timestamp_brin 
ON sensor_data USING BRIN (timestamp)
WITH (pages_per_range = 128);
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_sensor_timestamp_brin ON sensor_data USING BRIN (timestamp) WITH (pages_per_range = 128);"]]{{RUN}}

**Test BRIN index performance**:
```sql
EXPLAIN ANALYZE
SELECT * FROM sensor_data
WHERE timestamp BETWEEN '2025-03-01' AND '2025-03-31'
ORDER BY timestamp;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT * FROM sensor_data WHERE timestamp BETWEEN '2025-03-01' AND '2025-03-31' ORDER BY timestamp;"]]{{RUN}}

**Compare with B-tree index**:
```sql
CREATE INDEX idx_sensor_timestamp_btree 
ON sensor_data(timestamp);

EXPLAIN ANALYZE
SELECT * FROM sensor_data
WHERE timestamp BETWEEN '2025-03-01' AND '2025-03-31'
ORDER BY timestamp;
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_sensor_timestamp_btree ON sensor_data(timestamp); EXPLAIN ANALYZE SELECT * FROM sensor_data WHERE timestamp BETWEEN '2025-03-01' AND '2025-03-31' ORDER BY timestamp;"]]{{RUN}}

**Compare index sizes**:
```sql
SELECT 
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND relname = 'sensor_data'
ORDER BY pg_relation_size(indexrelid) DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT indexrelname AS index_name, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size FROM pg_stat_user_indexes WHERE schemaname = 'public' AND relname = 'sensor_data' ORDER BY pg_relation_size(indexrelid) DESC;"]]{{RUN}}

**What to observe**:
- BRIN index is much smaller than B-tree
- BRIN performs well for time-series data with natural ordering
- B-tree is more precise but larger

---

### Task 3: Optimize Query Rewriting

Rewrite queries to use more efficient execution plans.

**Create sample tables**:
```sql
CREATE TABLE products_rewrite (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    category VARCHAR(50),
    price NUMERIC(10, 2)
);

CREATE TABLE sales_rewrite (
    sale_id INT PRIMARY KEY,
    product_id INT REFERENCES products_rewrite(product_id),
    sale_date DATE,
    quantity INT,
    unit_price NUMERIC(10, 2)
);

INSERT INTO products_rewrite
SELECT 
    generate_series(1, 1000),
    'Product ' || generate_series(1, 1000),
    (ARRAY['electronics', 'clothing', 'food', 'furniture'])[floor(random() * 4 + 1)],
    (random() * 500 + 10)::NUMERIC(10, 2);

INSERT INTO sales_rewrite
SELECT 
    generate_series(1, 50000),
    (random() * 1000)::INT + 1,
    CURRENT_DATE - (random() * 365)::INT,
    (random() * 10 + 1)::INT,
    (random() * 500 + 10)::NUMERIC(10, 2);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE products_rewrite (product_id INT PRIMARY KEY, product_name VARCHAR(100), category VARCHAR(50), price NUMERIC(10, 2)); CREATE TABLE sales_rewrite (sale_id INT PRIMARY KEY, product_id INT REFERENCES products_rewrite(product_id), sale_date DATE, quantity INT, unit_price NUMERIC(10, 2)); INSERT INTO products_rewrite SELECT generate_series(1, 1000), 'Product ' || generate_series(1, 1000), (ARRAY['electronics', 'clothing', 'food', 'furniture'])[floor(random() * 4 + 1)], (random() * 500 + 10)::NUMERIC(10, 2); INSERT INTO sales_rewrite SELECT generate_series(1, 50000), (random() * 1000)::INT + 1, CURRENT_DATE - (random() * 365)::INT, (random() * 10 + 1)::INT, (random() * 500 + 10)::NUMERIC(10, 2);"]]{{RUN}}

**Inefficient query with OR**:
```sql
EXPLAIN ANALYZE
SELECT p.product_name, s.sale_date, s.quantity
FROM products_rewrite p
JOIN sales_rewrite s ON p.product_id = s.product_id
WHERE p.category = 'electronics'
    OR s.sale_date > '2025-06-01'
LIMIT 1000;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT p.product_name, s.sale_date, s.quantity FROM products_rewrite p JOIN sales_rewrite s ON p.product_id = s.product_id WHERE p.category = 'electronics' OR s.sale_date > '2025-06-01' LIMIT 1000;"]]{{RUN}}

**Rewritten query using UNION ALL**:
```sql
EXPLAIN ANALYZE
SELECT p.product_name, s.sale_date, s.quantity
FROM products_rewrite p
JOIN sales_rewrite s ON p.product_id = s.product_id
WHERE p.category = 'electronics'
UNION ALL
SELECT p.product_name, s.sale_date, s.quantity
FROM products_rewrite p
JOIN sales_rewrite s ON p.product_id = s.product_id
WHERE p.category <> 'electronics' AND s.sale_date > '2025-06-01'
LIMIT 1000;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT p.product_name, s.sale_date, s.quantity FROM products_rewrite p JOIN sales_rewrite s ON p.product_id = s.product_id WHERE p.category = 'electronics' UNION ALL SELECT p.product_name, s.sale_date, s.quantity FROM products_rewrite p JOIN sales_rewrite s ON p.product_id = s.product_id WHERE p.category <> 'electronics' AND s.sale_date > '2025-06-01' LIMIT 1000;"]]{{RUN}}

**What to observe**:
- UNION ALL version may be more efficient (avoids OR filter)
- Query planner can use indexes more effectively

---

### Task 4: Optimize Parallel Query Execution

GaussDB can execute queries in parallel for large operations.

**Create large fact table**:
```sql
CREATE TABLE sales_fact (
    sale_id BIGINT,
    product_id INT,
    customer_id INT,
    store_id INT,
    sale_date DATE,
    quantity INT,
    amount NUMERIC(12, 2)
);

INSERT INTO sales_fact
SELECT 
    generate_series(1, 2000000),
    (random() * 10000)::INT + 1,
    (random() * 5000)::INT + 1,
    (random() * 100)::INT + 1,
    CURRENT_DATE - (random() * 730)::INT,
    (random() * 100 + 1)::INT,
    (random() * 1000)::NUMERIC(12, 2);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE sales_fact (sale_id BIGINT, product_id INT, customer_id INT, store_id INT, sale_date DATE, quantity INT, amount NUMERIC(12, 2)); INSERT INTO sales_fact SELECT generate_series(1, 2000000), (random() * 10000)::INT + 1, (random() * 5000)::INT + 1, (random() * 100)::INT + 1, CURRENT_DATE - (random() * 730)::INT, (random() * 100 + 1)::INT, (random() * 1000)::NUMERIC(12, 2);"]]{{RUN}}

**Check parallel query settings**:
```sql
SHOW max_parallel_workers_per_gather;
SHOW max_parallel_workers;
SHOW parallel_setup_cost;
```

[[gsql -d postgres -p 5432 -c "SHOW max_parallel_workers_per_gather; SHOW max_parallel_workers; SHOW parallel_setup_cost;"]]{{RUN}}

**Enable parallelism**:
```sql
SET max_parallel_workers_per_gather = 4;
SET min_parallel_table_scan_size = '8MB';
```

[[gsql -d postgres -p 5432 -c "SET max_parallel_workers_per_gather = 4; SET min_parallel_table_scan_size = '8MB';"]]{{RUN}}

**Test parallel aggregation**:
```sql
EXPLAIN ANALYZE
SELECT 
    product_id,
    COUNT(*) AS sales_count,
    SUM(quantity) AS total_quantity,
    AVG(amount) AS avg_amount
FROM sales_fact
WHERE sale_date >= '2024-01-01'
GROUP BY product_id;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT product_id, COUNT(*) AS sales_count, SUM(quantity) AS total_quantity, AVG(amount) AS avg_amount FROM sales_fact WHERE sale_date >= '2024-01-01' GROUP BY product_id;"]]{{RUN}}

**What to observe**:
- "Gather" or "Gather Merge" nodes indicate parallel execution
- "Workers Planned" shows parallel workers used
- Parallel execution reduces large query execution time

---

### Task 5: Implement Hash Index for Equality Queries

Hash indexes are very fast for equality comparisons.

**Create test table**:
```sql
CREATE TABLE users_hash (
    user_id INT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    status VARCHAR(20)
);

INSERT INTO users_hash
SELECT 
    generate_series(1, 100000),
    'user_' || generate_series(1, 100000),
    'user' || generate_series(1, 100000) || '@example.com',
    (ARRAY['active', 'inactive', 'pending'])[floor(random() * 3 + 1)];
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE users_hash (user_id INT PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), status VARCHAR(20)); INSERT INTO users_hash SELECT generate_series(1, 100000), 'user_' || generate_series(1, 100000), 'user' || generate_series(1, 100000) || '@example.com', (ARRAY['active', 'inactive', 'pending'])[floor(random() * 3 + 1)];"]]{{RUN}}

**Create hash index on username**:
```sql
CREATE INDEX idx_users_hash_username 
ON users_hash USING HASH (username);
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_users_hash_username ON users_hash USING HASH (username);"]]{{RUN}}

**Test hash index performance**:
```sql
EXPLAIN ANALYZE
SELECT * FROM users_hash
WHERE username = 'user_50000';
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT * FROM users_hash WHERE username = 'user_50000';"]]{{RUN}}

**Compare with B-tree index**:
```sql
DROP INDEX idx_users_hash_username;
CREATE INDEX idx_users_hash_btree ON users_hash(username);

EXPLAIN ANALYZE
SELECT * FROM users_hash
WHERE username = 'user_50000';
```

[[gsql -d postgres -p 5432 -c "DROP INDEX idx_users_hash_username; CREATE INDEX idx_users_hash_btree ON users_hash(username); EXPLAIN ANALYZE SELECT * FROM users_hash WHERE username = 'user_50000';"]]{{RUN}}

**What to observe**:
- Hash index uses "Index Scan" with constant-time lookup
- Hash indexes are smaller for exact match queries
- B-tree indexes support range queries but hash indexes don't

---

### Task 6: Optimize Partitioned Tables

Partition large tables for better performance and maintenance.

**Create partitioned table with data**:
```sql
CREATE TABLE orders_partitioned (
    order_id BIGINT,
    customer_id INT,
    order_date DATE,
    total_amount NUMERIC(12, 2)
) PARTITION BY RANGE (order_date);

-- Create yearly partitions
CREATE TABLE orders_2024 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

INSERT INTO orders_partitioned
SELECT 
    generate_series(1, 1000000),
    (random() * 100000)::INT + 1,
    CURRENT_DATE - (random() * 730)::INT,
    (random() * 1000)::NUMERIC(12, 2);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE orders_partitioned (order_id BIGINT, customer_id INT, order_date DATE, total_amount NUMERIC(12, 2)) PARTITION BY RANGE (order_date); CREATE TABLE orders_2024 PARTITION OF orders_partitioned FOR VALUES FROM ('2024-01-01') TO ('2025-01-01'); CREATE TABLE orders_2025 PARTITION OF orders_partitioned FOR VALUES FROM ('2025-01-01') TO ('2026-01-01'); INSERT INTO orders_partitioned SELECT generate_series(1, 1000000), (random() * 100000)::INT + 1, CURRENT_DATE - (random() * 730)::INT, (random() * 1000)::NUMERIC(12, 2);"]]{{RUN}}

**Create indexes on partitions**:
```sql
CREATE INDEX idx_orders_2024_date ON orders_2024(order_date);
CREATE INDEX idx_orders_2025_date ON orders_2025(order_date);
CREATE INDEX idx_orders_2024_customer ON orders_2024(customer_id);
CREATE INDEX idx_orders_2025_customer ON orders_2025(customer_id);
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_orders_2024_date ON orders_2024(order_date); CREATE INDEX idx_orders_2025_date ON orders_2025(order_date); CREATE INDEX idx_orders_2024_customer ON orders_2024(customer_id); CREATE INDEX idx_orders_2025_customer ON orders_2025(customer_id);"]]{{RUN}}

**Test partition pruning**:
```sql
EXPLAIN ANALYZE
SELECT * FROM orders_partitioned
WHERE order_date >= '2025-06-01' AND order_date < '2025-07-01';
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT * FROM orders_partitioned WHERE order_date >= '2025-06-01' AND order_date < '2025-07-01';"]]{{RUN}}

**What to observe**:
- Query only scans relevant partition (partition pruning)
- "Append" node shows which partitions are accessed
- Reduced I/O and faster execution

---

### Task 7: Use Advanced EXPLAIN Features

Use advanced EXPLAIN options for deeper analysis.

**Enable detailed EXPLAIN output**:
```sql
EXPLAIN (VERBOSE, BUFFERS, ANALYZE)
SELECT product_id, SUM(amount) AS total
FROM sales_fact
WHERE sale_date >= '2025-01-01'
GROUP BY product_id
ORDER BY total DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (VERBOSE, BUFFERS, ANALYZE) SELECT product_id, SUM(amount) AS total FROM sales_fact WHERE sale_date >= '2025-01-01' GROUP BY product_id ORDER BY total DESC LIMIT 10;"]]{{RUN}}

**What to observe**:
- **BUFFERS**: Shows shared buffer hits and reads
- **VERBOSE**: Provides detailed node information
- **ANALYZE**: Shows actual execution times

**Check WAL usage with EXPLAIN**:
```sql
EXPLAIN (ANALYZE, BUFFERS, WAL)
UPDATE orders_partitioned
SET total_amount = total_amount * 1.1
WHERE order_date = CURRENT_DATE
LIMIT 100;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN (ANALYZE, BUFFERS, WAL) UPDATE orders_partitioned SET total_amount = total_amount * 1.1 WHERE order_date = CURRENT_DATE LIMIT 100;"]]{{RUN}}

**What to observe**:
- **WAL**: Shows WAL records written
- Important for understanding write performance impact

---

### Task 8: Clean Up Test Data

**Drop test tables**:
```sql
DROP TABLE orders_covering;
DROP TABLE sensor_data CASCADE;
DROP TABLE products_rewrite CASCADE;
DROP TABLE sales_rewrite CASCADE;
DROP TABLE sales_fact;
DROP TABLE users_hash;
DROP TABLE orders_partitioned CASCADE;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE orders_covering; DROP TABLE sensor_data CASCADE; DROP TABLE products_rewrite CASCADE; DROP TABLE sales_rewrite CASCADE; DROP TABLE sales_fact; DROP TABLE users_hash; DROP TABLE orders_partitioned CASCADE;"]]{{RUN}}

**Verify cleanup**:
```sql
 SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

[[gsql -d postgres -p 5432 -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Created and used covering indexes
- [ ] Task 2: Implemented BRIN indexes for time-series data
- [ ] Task 3: Rewrote queries for better performance
- [ ] Task 4: Optimized parallel query execution
- [ ] Task 5: Used hash indexes for equality queries
- [ ] Task 6: Optimized partitioned tables
- [ ] Task 7: Used advanced EXPLAIN features
- [ ] Task 8: Cleaned up test data

## Review Questions

1. **What is a covering index?**
   - [ ] An index that covers multiple tables
   - [ ] An index containing all columns needed for a query
   - [ ] A special type of B-tree index
   - [ ] An index used for partitioning

2. **When should you use BRIN indexes?**
   - [ ] For small tables with random data
   - [ ] For large tables with naturally ordered data
   - [ ] For frequently updated tables
   - [ ] For point queries only

3. **What does parallel query execution require?**
   - [ ] Multiple database servers
   - [ ] Sufficient table size and worker configuration
   - [ ] Special hardware
   - [ ] Manual partition setup

4. **What is partition pruning?**
   - [ ] Deleting unused partitions
   - [ ] Query optimizer skipping irrelevant partitions
   - [ ] Merging partitions
   - [ ] Creating new partitions

## Summary

In this L3 lab, you practiced:
- **Covering Indexes**: Eliminating table lookups with index-only scans
- **BRIN Indexes**: Efficient indexing for large time-series data
- **Query Rewriting**: Improving performance with UNION ALL
- **Parallel Execution**: Optimizing large-scale queries
- **Hash Indexes**: Fast equality comparisons
- **Table Partitioning**: Partition pruning and maintenance
- **Advanced EXPLAIN**: Using BUFFERS, WAL, and VERBOSE options

These advanced performance optimization techniques enable you to handle complex, large-scale production scenarios in GaussDB.

## Next Steps

Proceed to **L4 Lab** to practice expert-level operations including:
- Complex query optimization challenges
- Multi-dimensional indexing strategies
- Distributed query optimization
- Real-time performance monitoring and tuning
- Advanced troubleshooting scenarios
