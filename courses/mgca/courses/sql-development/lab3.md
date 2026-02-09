# SQL Development Module - L3 Lab: Advanced SQL Performance

## Lab Overview

In this L3 (Advanced Level) lab, you will practice advanced SQL development with focus on performance optimization in GaussDB, including:
- Advanced window functions for analytics
- Materialized views for query performance
- Recursive queries for hierarchical data
- Query optimization with hints and CTEs
- Advanced aggregation techniques

**Time Required**: 55 minutes
**Prerequisites**: Completed L1 and L2 SQL Development Labs, familiarity with joins

## Learning Objectives

By completing this lab, you will be able to:
- Use advanced window functions for complex analytics
- Implement materialized views for performance
- Write recursive queries for hierarchical data
- Optimize queries with hints and advanced CTEs
- Use advanced aggregation techniques

## Lab Tasks

### Task 1: Advanced Window Functions

Use window functions for complex analytics without self-joins.

**Create sales data**:
```sql
CREATE TABLE sales_advanced (
    sale_id INT PRIMARY KEY,
    product_id INT,
    sale_date DATE,
    quantity INT,
    amount NUMERIC(12, 2),
    region VARCHAR(20)
);

INSERT INTO sales_advanced
SELECT 
    generate_series(1, 50000),
    (random() * 1000)::INT + 1,
    CURRENT_DATE - (random() * 365)::INT,
    (random() * 10 + 1)::INT,
    (random() * 1000)::NUMERIC(12, 2),
    (ARRAY['north', 'south', 'east', 'west'])[floor(random() * 4 + 1)];
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE sales_advanced (sale_id INT PRIMARY KEY, product_id INT, sale_date DATE, quantity INT, amount NUMERIC(12, 2), region VARCHAR(20)); INSERT INTO sales_advanced SELECT generate_series(1, 50000), (random() * 1000)::INT + 1, CURRENT_DATE - (random() * 365)::INT, (random() * 10 + 1)::INT, (random() * 1000)::NUMERIC(12, 2), (ARRAY['north', 'south', 'east', 'west'])[floor(random() * 4 + 1)];"]]{{RUN}}

**Calculate running totals with window functions**:
```sql
SELECT 
    sale_date,
    region,
    amount,
    SUM(amount) OVER (
        PARTITION BY region 
        ORDER BY sale_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,
    SUM(amount) OVER (
        PARTITION BY region 
        ORDER BY sale_date
        ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
    ) AS future_total
FROM sales_advanced
WHERE sale_date >= '2025-01-01'
ORDER BY region, sale_date
LIMIT 20;
```

[[gsql -d postgres -p 5432 -c "SELECT sale_date, region, amount, SUM(amount) OVER (PARTITION BY region ORDER BY sale_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total, SUM(amount) OVER (PARTITION BY region ORDER BY sale_date ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS future_total FROM sales_advanced WHERE sale_date >= '2025-01-01' ORDER BY region, sale_date LIMIT 20;"]]{{RUN}}

**Calculate percentiles and ranks**:
```sql
SELECT 
    product_id,
    AVG(amount) AS avg_amount,
    PERCENT_RANK() OVER (ORDER BY AVG(amount)) AS amount_percentile,
    RANK() OVER (ORDER BY AVG(amount) DESC) AS sales_rank,
    DENSE_RANK() OVER (ORDER BY AVG(amount) DESC) AS dense_rank
FROM sales_advanced
GROUP BY product_id
ORDER BY avg_amount DESC
LIMIT 20;
```

[[gsql -d postgres -p 5432 -c "SELECT product_id, AVG(amount) AS avg_amount, PERCENT_RANK() OVER (ORDER BY AVG(amount)) AS amount_percentile, RANK() OVER (ORDER BY AVG(amount) DESC) AS sales_rank, DENSE_RANK() OVER (ORDER BY AVG(amount) DESC) AS dense_rank FROM sales_advanced GROUP BY product_id ORDER BY avg_amount DESC LIMIT 20;"]]{{RUN}}

**Use LAG/LEAD for period-over-period analysis**:
```sql
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', sale_date) AS month,
        region,
        SUM(amount) AS total_sales
    FROM sales_advanced
    GROUP BY DATE_TRUNC('month', sale_date), region
)
SELECT 
    month,
    region,
    total_sales,
    LAG(total_sales, 1) OVER (PARTITION BY region ORDER BY month) AS prev_month_sales,
    LEAD(total_sales, 1) OVER (PARTITION BY region ORDER BY month) AS next_month_sales,
    ROUND((total_sales - LAG(total_sales, 1) OVER (PARTITION BY region ORDER BY month)) * 100.0 / NULLIF(LAG(total_sales, 1) OVER (PARTITION BY region ORDER BY month), 0), 2) AS growth_pct
FROM monthly_sales
ORDER BY region, month
LIMIT 20;
```

[[gsql -d postgres -p 5432 -c "WITH monthly_sales AS (SELECT DATE_TRUNC('month', sale_date) AS month, region, SUM(amount) AS total_sales FROM sales_advanced GROUP BY DATE_TRUNC('month', sale_date), region) SELECT month, region, total_sales, LAG(total_sales, 1) OVER (PARTITION BY region ORDER BY month) AS prev_month_sales, LEAD(total_sales, 1) OVER (PARTITION BY region ORDER BY month) AS next_month_sales, ROUND((total_sales - LAG(total_sales, 1) OVER (PARTITION BY region ORDER BY month)) * 100.0 / NULLIF(LAG(total_sales, 1) OVER (PARTITION BY region ORDER BY month), 0), 2) AS growth_pct FROM monthly_sales ORDER BY region, month LIMIT 20;"]]{{RUN}}

**What to observe**:
- Window functions eliminate need for self-joins
- ROWS frame controls window boundaries
- LAG/LEAD provide access to previous/next rows

---

### Task 2: Create Materialized Views

Materialized views store query results physically and can be refreshed.

**Create materialized view for summary data**:
```sql
CREATE MATERIALIZED VIEW mv_sales_summary AS
SELECT 
    DATE_TRUNC('month', sale_date) AS month,
    region,
    COUNT(*) AS sale_count,
    SUM(quantity) AS total_quantity,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount
FROM sales_advanced
GROUP BY DATE_TRUNC('month', sale_date), region
WITH DATA;
```

[[gsql -d postgres -p 5432 -c "CREATE MATERIALIZED VIEW mv_sales_summary AS SELECT DATE_TRUNC('month', sale_date) AS month, region, COUNT(*) AS sale_count, SUM(quantity) AS total_quantity, SUM(amount) AS total_amount, AVG(amount) AS avg_amount, MIN(amount) AS min_amount, MAX(amount) AS max_amount FROM sales_advanced GROUP BY DATE_TRUNC('month', sale_date), region WITH DATA;"]]{{RUN}}

**Query materialized view (fast)**:
```sql
EXPLAIN ANALYZE
SELECT * FROM mv_sales_summary
WHERE month >= '2025-01-01'
ORDER BY region, month;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT * FROM mv_sales_summary WHERE month >= '2025-01-01' ORDER BY region, month;"]]{{RUN}}

**Compare with regular query (slower)**:
```sql
EXPLAIN ANALYZE
SELECT 
    DATE_TRUNC('month', sale_date) AS month,
    region,
    COUNT(*) AS sale_count,
    SUM(quantity) AS total_quantity,
    SUM(amount) AS total_amount
FROM sales_advanced
WHERE sale_date >= '2025-01-01'
GROUP BY DATE_TRUNC('month', sale_date), region
ORDER BY region, month;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT DATE_TRUNC('month', sale_date) AS month, region, COUNT(*) AS sale_count, SUM(quantity) AS total_quantity, SUM(amount) AS total_amount FROM sales_advanced WHERE sale_date >= '2025-01-01' GROUP BY DATE_TRUNC('month', sale_date), region ORDER BY region, month;"]]{{RUN}}

**Refresh materialized view**:
```sql
-- Add new data
INSERT INTO sales_advanced
SELECT 
    generate_series(50001, 51000),
    (random() * 1000)::INT + 1,
    CURRENT_DATE,
    (random() * 10 + 1)::INT,
    (random() * 1000)::NUMERIC(12, 2),
    (ARRAY['north', 'south', 'east', 'west'])[floor(random() * 4 + 1)];

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_sales_summary;

-- Verify updated data
SELECT * FROM mv_sales_summary
WHERE month = DATE_TRUNC('month', CURRENT_DATE);
```

[[gsql -d postgres -p 5432 -c "INSERT INTO sales_advanced SELECT generate_series(50001, 51000), (random() * 1000)::INT + 1, CURRENT_DATE, (random() * 10 + 1)::INT, (random() * 1000)::NUMERIC(12, 2), (ARRAY['north', 'south', 'east', 'west'])[floor(random() * 4 + 1)]; REFRESH MATERIALIZED VIEW mv_sales_summary; SELECT * FROM mv_sales_summary WHERE month = DATE_TRUNC('month', CURRENT_DATE);"]]{{RUN}}

**What to observe**:
- Materialized views provide fast read performance
- Must be refreshed when base data changes
- Consider refresh frequency vs data freshness

---

### Task 3: Recursive Queries for Hierarchical Data

Use WITH RECURSIVE for tree/hierarchical data structures.

**Create organizational hierarchy table**:
```sql
CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    emp_name VARCHAR(100),
    manager_id INT REFERENCES employees(emp_id),
    department VARCHAR(50),
    salary NUMERIC(12, 2)
);

INSERT INTO employees VALUES
(1, 'CEO', NULL, 'Executive', 100000),
(2, 'VP Engineering', 1, 'Executive', 90000),
(3, 'VP Marketing', 1, 'Executive', 85000),
(4, 'CTO', 2, 'Engineering', 95000),
(5, 'Engineering Manager', 4, 'Engineering', 80000),
(6, 'Senior Developer', 5, 'Engineering', 75000),
(7, 'Developer', 5, 'Engineering', 60000),
(8, 'Developer', 5, 'Engineering', 55000),
(9, 'Marketing Manager', 3, 'Marketing', 70000),
(10, 'Marketing Specialist', 9, 'Marketing', 50000);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE employees (emp_id INT PRIMARY KEY, emp_name VARCHAR(100), manager_id INT REFERENCES employees(emp_id), department VARCHAR(50), salary NUMERIC(12, 2)); INSERT INTO employees VALUES (1, 'CEO', NULL, 'Executive', 100000), (2, 'VP Engineering', 1, 'Executive', 90000), (3, 'VP Marketing', 1, 'Executive', 85000), (4, 'CTO', 2, 'Engineering', 95000), (5, 'Engineering Manager', 4, 'Engineering', 80000), (6, 'Senior Developer', 5, 'Engineering', 75000), (7, 'Developer', 5, 'Engineering', 60000), (8, 'Developer', 5, 'Engineering', 55000), (9, 'Marketing Manager', 3, 'Marketing', 70000), (10, 'Marketing Specialist', 9, 'Marketing', 50000);"]]{{RUN}}

**Recursive query to find all subordinates**:
```sql
WITH RECURSIVE org_tree AS (
    -- Anchor: start with CEO
    SELECT 
        emp_id,
        emp_name,
        manager_id,
        department,
        salary,
        1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive: find all direct reports
    SELECT 
        e.emp_id,
        e.emp_name,
        e.manager_id,
        e.department,
        e.salary,
        ot.level + 1 AS level
    FROM employees e
    JOIN org_tree ot ON e.manager_id = ot.emp_id
)
SELECT 
    emp_id,
    emp_name,
    manager_id,
    department,
    salary,
    level,
    REPEAT('  ', level - 1) || emp_name AS tree_structure
FROM org_tree
ORDER BY level, emp_id;
```

[[gsql -d postgres -p 5432 -c "WITH RECURSIVE org_tree AS (SELECT emp_id, emp_name, manager_id, department, salary, 1 AS level FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.emp_id, e.emp_name, e.manager_id, e.department, e.salary, ot.level + 1 AS level FROM employees e JOIN org_tree ot ON e.manager_id = ot.emp_id) SELECT emp_id, emp_name, manager_id, department, salary, level, REPEAT('  ', level - 1) || emp_name AS tree_structure FROM org_tree ORDER BY level, emp_id;"]]{{RUN}}

**Calculate total salary by department**:
```sql
WITH RECURSIVE org_tree AS (
    SELECT emp_id, emp_name, manager_id, department, salary, 1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    SELECT e.emp_id, e.emp_name, e.manager_id, e.department, e.salary, ot.level + 1
    FROM employees e
    JOIN org_tree ot ON e.manager_id = ot.emp_id
)
SELECT 
    department,
    COUNT(*) AS employee_count,
    SUM(salary) AS total_salary,
    AVG(salary) AS avg_salary
FROM org_tree
GROUP BY department
ORDER BY total_salary DESC;
```

[[gsql -d postgres -p 5432 -c "WITH RECURSIVE org_tree AS (SELECT emp_id, emp_name, manager_id, department, salary, 1 AS level FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.emp_id, e.emp_name, e.manager_id, e.department, e.salary, ot.level + 1 FROM employees e JOIN org_tree ot ON e.manager_id = ot.emp_id) SELECT department, COUNT(*) AS employee_count, SUM(salary) AS total_salary, AVG(salary) AS avg_salary FROM org_tree GROUP BY department ORDER BY total_salary DESC;"]]{{RUN}}

**What to observe**:
- Recursive queries use anchor + recursive member
- Cycles are prevented by tracking visited nodes
- Useful for organizational charts, bill of materials, etc.

---

### Task 4: Advanced Aggregation with FILTER

Use FILTER clause for conditional aggregation.

**Create customer orders data**:
```sql
CREATE TABLE orders_filter (
    order_id INT,
    customer_id INT,
    order_date DATE,
    status VARCHAR(20),
    amount NUMERIC(12, 2)
);

INSERT INTO orders_filter
SELECT 
    generate_series(1, 30000),
    (random() * 1000)::INT + 1,
    CURRENT_DATE - (random() * 365)::INT,
    (ARRAY['completed', 'pending', 'cancelled', 'shipped'])[floor(random() * 4 + 1)],
    (random() * 1000)::NUMERIC(12, 2);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE orders_filter (order_id INT, customer_id INT, order_date DATE, status VARCHAR(20), amount NUMERIC(12, 2)); INSERT INTO orders_filter SELECT generate_series(1, 30000), (random() * 1000)::INT + 1, CURRENT_DATE - (random() * 365)::INT, (ARRAY['completed', 'pending', 'cancelled', 'shipped'])[floor(random() * 4 + 1)], (random() * 1000)::NUMERIC(12, 2);"]]{{RUN}}

**Traditional approach with CASE (verbose)**:
```sql
SELECT 
    customer_id,
    COUNT(*) AS total_orders,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
FROM orders_filter
GROUP BY customer_id
ORDER BY total_orders DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT customer_id, COUNT(*) AS total_orders, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders, SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders FROM orders_filter GROUP BY customer_id ORDER BY total_orders DESC LIMIT 10;"]]{{RUN}}

**FILTER clause approach (cleaner)**:
```sql
SELECT 
    customer_id,
    COUNT(*) AS total_orders,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
    SUM(amount) AS total_spent,
    SUM(amount) FILTER (WHERE status = 'completed') AS completed_amount
FROM orders_filter
GROUP BY customer_id
ORDER BY total_orders DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT customer_id, COUNT(*) AS total_orders, COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders, COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders, COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders, SUM(amount) AS total_spent, SUM(amount) FILTER (WHERE status = 'completed') AS completed_amount FROM orders_filter GROUP BY customer_id ORDER BY total_orders DESC LIMIT 10;"]]{{RUN}}

**What to observe**:
- FILTER clause is more readable than CASE
- Works with any aggregate function
- Performance is similar to CASE approach

---

### Task 5: Advanced CTE Optimization

Use materialized CTEs for query optimization.

**Create test data**:
```sql
CREATE TABLE products_cte (
    product_id INT,
    category VARCHAR(50),
    price NUMERIC(10, 2)
);

CREATE TABLE transactions_cte (
    transaction_id INT,
    product_id INT,
    quantity INT,
    transaction_date DATE,
    amount NUMERIC(12, 2)
);

INSERT INTO products_cte
SELECT generate_series(1, 5000),
    (ARRAY['electronics', 'clothing', 'food', 'furniture'])[floor(random() * 4 + 1)],
    (random() * 500 + 10)::NUMERIC(10, 2);

INSERT INTO transactions_cte
SELECT 
    generate_series(1, 100000),
    (random() * 5000)::INT + 1,
    (random() * 10 + 1)::INT,
    CURRENT_DATE - (random() * 365)::INT,
    (random() * 1000)::NUMERIC(12, 2);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE products_cte (product_id INT, category VARCHAR(50), price NUMERIC(10, 2)); CREATE TABLE transactions_cte (transaction_id INT, product_id INT, quantity INT, transaction_date DATE, amount NUMERIC(12, 2)); INSERT INTO products_cte SELECT generate_series(1, 5000), (ARRAY['electronics', 'clothing', 'food', 'furniture'])[floor(random() * 4 + 1)], (random() * 500 + 10)::NUMERIC(10, 2); INSERT INTO transactions_cte SELECT generate_series(1, 100000), (random() * 5000)::INT + 1, (random() * 10 + 1)::INT, CURRENT_DATE - (random() * 365)::INT, (random() * 1000)::NUMERIC(12, 2);"]]{{RUN}}

**CTE without materialization**:
```sql
EXPLAIN ANALYZE
WITH category_sales AS (
    SELECT 
        p.category,
        t.product_id,
        COUNT(*) AS sales_count,
        SUM(t.amount) AS total_amount
    FROM products_cte p
    JOIN transactions_cte t ON p.product_id = t.product_id
    WHERE t.transaction_date >= '2025-01-01'
    GROUP BY p.category, t.product_id
)
SELECT 
    category,
    AVG(sales_count) AS avg_product_sales,
    SUM(total_amount) AS category_total
FROM category_sales
GROUP BY category
ORDER BY category_total DESC;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE WITH category_sales AS (SELECT p.category, t.product_id, COUNT(*) AS sales_count, SUM(t.amount) AS total_amount FROM products_cte p JOIN transactions_cte t ON p.product_id = t.product_id WHERE t.transaction_date >= '2025-01-01' GROUP BY p.category, t.product_id) SELECT category, AVG(sales_count) AS avg_product_sales, SUM(total_amount) AS category_total FROM category_sales GROUP BY category ORDER BY category_total DESC;"]]{{RUN}}

**CTE with MATERIALIZED hint**:
```sql
EXPLAIN ANALYZE
WITH category_sales AS MATERIALIZED (
    SELECT 
        p.category,
        t.product_id,
        COUNT(*) AS sales_count,
        SUM(t.amount) AS total_amount
    FROM products_cte p
    JOIN transactions_cte t ON p.product_id = t.product_id
    WHERE t.transaction_date >= '2025-01-01'
    GROUP BY p.category, t.product_id
)
SELECT 
    category,
    AVG(sales_count) AS avg_product_sales,
    SUM(total_amount) AS category_total
FROM category_sales
GROUP BY category
ORDER BY category_total DESC;
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE WITH category_sales AS MATERIALIZED (SELECT p.category, t.product_id, COUNT(*) AS sales_count, SUM(t.amount) AS total_amount FROM products_cte p JOIN transactions_cte t ON p.product_id = t.product_id WHERE t.transaction_date >= '2025-01-01' GROUP BY p.category, t.product_id) SELECT category, AVG(sales_count) AS avg_product_sales, SUM(total_amount) AS category_total FROM category_sales GROUP BY category ORDER BY category_total DESC;"]]{{RUN}}

**What to observe**:
- MATERIALIZED hint forces CTE to be computed once
- Useful when CTE is referenced multiple times
- Query optimizer may inline CTEs by default

---

### Task 6: Advanced JSON Operations

Use JSON functions for complex document handling.

**Create JSON data table**:
```sql
CREATE TABLE documents (
    doc_id INT,
    doc_name VARCHAR(100),
    metadata JSONB
);

INSERT INTO documents
SELECT 
    generate_series(1, 1000),
    'Document ' || generate_series(1, 1000),
    jsonb_build_object(
        'version', (random() * 10)::INT + 1,
        'author', 'User ' || (random() * 100)::INT,
        'tags', ARRAY[
            'important', 'draft', 'review', 'final', 'archived'
        ][floor(random() * 5)],
        'properties', jsonb_build_object(
            'size', (random() * 10240)::INT,
            'pages', (random() * 100)::INT + 1
        ),
        'history', jsonb_agg(
            jsonb_build_object(
                'action', (ARRAY['create', 'edit', 'delete'])[floor(random() * 3)],
                'timestamp', now() - (random() * 365 * 24 * 3600)::interval
            )
        )
    )
FROM generate_series(1, 1000);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE documents (doc_id INT, doc_name VARCHAR(100), metadata JSONB); INSERT INTO documents SELECT generate_series(1, 1000), 'Document ' || generate_series(1, 1000), jsonb_build_object('version', (random() * 10)::INT + 1, 'author', 'User ' || (random() * 100)::INT, 'tags', ARRAY['important', 'draft', 'review', 'final', 'archived'][floor(random() * 5)], 'properties', jsonb_build_object('size', (random() * 10240)::INT, 'pages', (random() * 100)::INT + 1), 'history', jsonb_agg(jsonb_build_object('action', (ARRAY['create', 'edit', 'delete'])[floor(random() * 3)], 'timestamp', now() - (random() * 365 * 24 * 3600)::interval))) FROM generate_series(1, 1000);"]]{{RUN}}

**Query JSON fields**:
```sql
SELECT 
    doc_id,
    doc_name,
    metadata->>'version' AS version,
    metadata->>'author' AS author,
    metadata->'properties'->>'size' AS file_size,
    metadata->'properties'->>'pages' AS pages
FROM documents
WHERE (metadata->>'version')::INT > 5
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT doc_id, doc_name, metadata->>'version' AS version, metadata->>'author' AS author, metadata->'properties'->>'size' AS file_size, metadata->'properties'->>'pages' AS pages FROM documents WHERE (metadata->>'version')::INT > 5 LIMIT 10;"]]{{RUN}}

**JSON path queries with @> operator**:
```sql
SELECT 
    doc_id,
    doc_name,
    metadata
FROM documents
WHERE metadata @> '{"properties": {"pages": "50"}}'
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "SELECT doc_id, doc_name, metadata FROM documents WHERE metadata @> '{\"properties\": {\"pages\": \"50\"}}' LIMIT 10;"]]{{RUN}}

**Create GIN index on JSONB**:
```sql
CREATE INDEX idx_docs_metadata ON documents USING GIN (metadata);

-- Test index usage
EXPLAIN ANALYZE
SELECT doc_id, doc_name
FROM documents
WHERE metadata @> '{"tags": "important"}';
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_docs_metadata ON documents USING GIN (metadata); EXPLAIN ANALYZE SELECT doc_id, doc_name FROM documents WHERE metadata @> '{\"tags\": \"important\"}';"]]{{RUN}}

**What to observe**:
- JSONB supports efficient indexing with GIN
- @> operator checks for containment
- ->> extracts values as text

---

### Task 7: Query Performance with Hints

Use query hints to guide optimizer decisions.

**Create test data**:
```sql
CREATE TABLE employees_hint (
    emp_id INT,
    department VARCHAR(50),
    salary NUMERIC(12, 2),
    hire_date DATE
);

INSERT INTO employees_hint
SELECT 
    generate_series(1, 100000),
    (ARRAY['IT', 'HR', 'Finance', 'Sales', 'Marketing'])[floor(random() * 5 + 1)],
    (random() * 100000 + 30000)::NUMERIC(12, 2),
    CURRENT_DATE - (random() * 3650)::INT;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE employees_hint (emp_id INT, department VARCHAR(50), salary NUMERIC(12, 2), hire_date DATE); INSERT INTO employees_hint SELECT generate_series(1, 100000), (ARRAY['IT', 'HR', 'Finance', 'Sales', 'Marketing'])[floor(random() * 5 + 1)], (random() * 100000 + 30000)::NUMERIC(12, 2), CURRENT_DATE - (random() * 3650)::INT;"]]{{RUN}}

**Force index scan with hint**:
```sql
CREATE INDEX idx_emp_dept ON employees_hint(department);
CREATE INDEX idx_emp_salary ON employees_hint(salary);

EXPLAIN ANALYZE
SELECT * FROM employees_hint
WHERE department = 'IT'
ORDER BY salary DESC
LIMIT 10;
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_emp_dept ON employees_hint(department); CREATE INDEX idx_emp_salary ON employees_hint(salary); EXPLAIN ANALYZE SELECT * FROM employees_hint WHERE department = 'IT' ORDER BY salary DESC LIMIT 10;"]]{{RUN}}

**Enable parallel query**:
```sql
SET max_parallel_workers_per_gather = 4;
SET min_parallel_table_scan_size = '8MB';

EXPLAIN ANALYZE
SELECT department, AVG(salary) AS avg_salary
FROM employees_hint
GROUP BY department;
```

[[gsql -d postgres -p 5432 -c "SET max_parallel_workers_per_gather = 4; SET min_parallel_table_scan_size = '8MB'; EXPLAIN ANALYZE SELECT department, AVG(salary) AS avg_salary FROM employees_hint GROUP BY department;"]]{{RUN}}

**What to observe**:
- Indexes improve query performance
- Parallel query execution speeds up aggregations
- Hints guide optimizer decisions

---

### Task 8: Clean Up Test Data

**Drop test tables**:
```sql
DROP TABLE sales_advanced;
DROP MATERIALIZED VIEW mv_sales_summary;
DROP TABLE employees;
DROP TABLE orders_filter;
DROP TABLE products_cte;
DROP TABLE transactions_cte;
DROP TABLE documents;
DROP TABLE employees_hint;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE sales_advanced; DROP MATERIALIZED VIEW mv_sales_summary; DROP TABLE employees; DROP TABLE orders_filter; DROP TABLE products_cte; DROP TABLE transactions_cte; DROP TABLE documents; DROP TABLE employees_hint;"]]{{RUN}}

**Verify cleanup**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

[[gsql -d postgres -p 5432 -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Used advanced window functions
- [ ] Task 2: Created and managed materialized views
- [ ] Task 3: Wrote recursive queries
- [ ] Task 4: Used FILTER clause for conditional aggregation
- [ ] Task 5: Optimized queries with CTEs
- [ ] Task 6: Performed advanced JSON operations
- [ ] Task 7: Used query hints for optimization
- [ ] Task 8: Cleaned up test data

## Review Questions

1. **What is advantage of materialized views?**
   - [ ] Always have fresh data
   - [ ] Faster query performance
   - [ ] No need for indexes
   - [ ] Smaller storage

2. **What does RECURSIVE CTE do?**
   - [ ] Repeats query multiple times
   - [ ] References itself for hierarchical data
   - [ ] Caches results
   - [ ] Creates temporary tables

3. **What is FILTER clause used for?**
   - [ ] Filtering rows before aggregation
   - [ ] Conditional aggregation in single query
   - [ ] Filtering results after aggregation
   - [ ] Creating indexes

4. **What JSONB operator checks containment?**
   - [ ] ->
   - [ ] ->>
   - [ ] @>
   - [ ] #

## Summary

In this L3 lab, you practiced:
- **Window Functions**: Advanced analytics without self-joins
- **Materialized Views**: Pre-computed query results for performance
- **Recursive Queries**: Hierarchical data traversal
- **FILTER Clause**: Conditional aggregation
- **CTE Optimization**: Materialized vs inline CTEs
- **JSON Operations**: Advanced JSONB queries and indexing
- **Query Hints**: Guiding optimizer decisions

These advanced SQL techniques enable you to write efficient, performant queries for complex business requirements in GaussDB.

## Next Steps

Proceed to **L4 Lab** to practice expert-level operations including:
- Complex query optimization challenges
- Advanced data transformation techniques
- Performance tuning of large-scale workloads
- Database function optimization
- Advanced troubleshooting scenarios
