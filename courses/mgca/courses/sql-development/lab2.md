# SQL Development Module - L2 Lab: Advanced SQL Operations

## Lab Overview

In this L2 (Intermediate Level) lab, you will practice advanced SQL operations in GaussDB, including:
- Advanced DDL operations (views, indexes, constraints)
- Complex DML with UPSERT and RETURNING
- Advanced querying with subqueries and CASE expressions
- Working with JSON data types

**Time Required**: 35 minutes
**Prerequisites**: Completed L1 SQL Development Lab, order_mgmt database exists

## Learning Objectives

By completing this lab, you will be able to:
- Create and manage views and indexes
- Perform UPSERT operations with conflict resolution
- Use RETURNING clause for data validation
- Write complex queries with subqueries and CASE
- Work with JSON data type

## Lab Tasks

### Task 1: Create Views for Data Abstraction

Let's create views to simplify data access and implement security.

**Create customer order summary view**:
```sql
CREATE VIEW customer_order_summary AS
SELECT 
    c.customer_id,
    c.customer_name,
    c.email,
    count(o.order_id) AS total_orders,
    sum(o.total_amount) AS total_spent,
    max(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name, c.email;
```

[[gsql -d order_mgmt -p 5432 -c "CREATE VIEW customer_order_summary AS SELECT c.customer_id, c.customer_name, c.email, count(o.order_id) AS total_orders, sum(o.total_amount) AS total_spent, max(o.order_date) AS last_order_date FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.customer_name, c.email;"]]{{RUN}}

**Query the view**:
```sql
SELECT * FROM customer_order_summary ORDER BY total_spent DESC;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT * FROM customer_order_summary ORDER BY total_spent DESC;"]]{{RUN}}

**Create order details view**:
```sql
CREATE VIEW order_details AS
SELECT 
    o.order_id,
    o.customer_id,
    c.customer_name,
    o.order_date,
    o.total_amount,
    o.status,
    sum(oi.quantity * oi.unit_price) AS items_total
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.customer_id, c.customer_name, o.order_date, o.total_amount, o.status;
```

[[gsql -d order_mgmt -p 5432 -c "CREATE VIEW order_details AS SELECT o.order_id, o.customer_id, c.customer_name, o.order_date, o.total_amount, o.status, sum(oi.quantity * oi.unit_price) AS items_total FROM orders o JOIN customers c ON o.customer_id = c.customer_id LEFT JOIN order_items oi ON o.order_id = oi.order_id GROUP BY o.order_id, o.customer_id, c.customer_name, o.order_date, o.total_amount, o.status;"]]{{RUN}}

---

### Task 2: Create Indexes for Performance

Let's create indexes to optimize query performance.

**Create index on customer email**:
```sql
CREATE INDEX idx_customers_email ON customers(email);
```

[[gsql -d order_mgmt -p 5432 -c "CREATE INDEX idx_customers_email ON customers(email);"]]{{RUN}}

**Create composite index on orders**:
```sql
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date DESC);
```

[[gsql -d order_mgmt -p 5432 -c "CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date DESC);"]]{{RUN}}

**Create index on order status**:
```sql
CREATE INDEX idx_orders_status ON orders(status);
```

[[gsql -d order_mgmt -p 5432 -c "CREATE INDEX idx_orders_status ON orders(status);"]]{{RUN}}

**Verify indexes**:
```sql
SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('customers', 'orders', 'order_items')
ORDER BY tablename, indexname;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT schemaname AS schema_name, tablename AS table_name, indexname AS index_name, indexdef AS index_definition FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('customers', 'orders', 'order_items') ORDER BY tablename, indexname;"]]{{RUN}}

---

### Task 3: Add Table Constraints

Let's add constraints to enforce data integrity.

**Add CHECK constraint for order amount**:
```sql
ALTER TABLE orders 
ADD CONSTRAINT chk_positive_amount 
CHECK (total_amount > 0);
```

[[gsql -d order_mgmt -p 5432 -c "ALTER TABLE orders ADD CONSTRAINT chk_positive_amount CHECK (total_amount > 0);"]]{{RUN}}

**Add CHECK constraint for item quantity**:
```sql
ALTER TABLE order_items 
ADD CONSTRAINT chk_positive_quantity 
CHECK (quantity > 0);
```

[[gsql -d order_mgmt -p 5432 -c "ALTER TABLE order_items ADD CONSTRAINT chk_positive_quantity CHECK (quantity > 0);"]]{{RUN}}

**Add UNIQUE constraint on customer email**:
```sql
ALTER TABLE customers 
ADD CONSTRAINT uq_customer_email 
UNIQUE (email);
```

[[gsql -d order_mgmt -p 5432 -c "ALTER TABLE customers ADD CONSTRAINT uq_customer_email UNIQUE (email);"]]{{RUN}}

**Verify constraints**:
```sql
SELECT 
    conname AS constraint_name,
    con_type AS constraint_type,
    table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid IN (
    'customers'::regclass,
    'orders'::regclass,
    'order_items'::regclass
)
ORDER BY table_name, conname;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT conname AS constraint_name, con_type AS constraint_type, table_name, pg_get_constraintdef(oid) AS constraint_definition FROM pg_constraint WHERE conrelid IN ('customers'::regclass, 'orders'::regclass, 'order_items'::regclass) ORDER BY table_name, conname;"]]{{RUN}}

---

### Task 4: Perform UPSERT Operations

Let's use INSERT...ON CONFLICT for upsert functionality.

**Insert customer with conflict handling**:
```sql
INSERT INTO customers (customer_id, customer_name, email, phone, address)
VALUES (4, 'Alice Williams', 'alice@example.com', '555-1234', '456 Oak St')
ON CONFLICT (email)
DO UPDATE SET 
    customer_name = EXCLUDED.customer_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    registration_date = CURRENT_DATE;
```

[[gsql -d order_mgmt -p 5432 -c "INSERT INTO customers (customer_id, customer_name, email, phone, address) VALUES (4, 'Alice Williams', 'alice@example.com', '555-1234', '456 Oak St') ON CONFLICT (email) DO UPDATE SET customer_name = EXCLUDED.customer_name, phone = EXCLUDED.phone, address = EXCLUDED.address, registration_date = CURRENT_DATE;"]]{{RUN}}

**Try inserting same email again**:
```sql
INSERT INTO customers (customer_id, customer_name, email, phone, address)
VALUES (5, 'Alice Updated', 'alice@example.com', '555-9999', '789 Pine St')
ON CONFLICT (email)
DO UPDATE SET 
    customer_name = EXCLUDED.customer_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address;
```

[[gsql -d order_mgmt -p 5432 -c "INSERT INTO customers (customer_id, customer_name, email, phone, address) VALUES (5, 'Alice Updated', 'alice@example.com', '555-9999', '789 Pine St') ON CONFLICT (email) DO UPDATE SET customer_name = EXCLUDED.customer_name, phone = EXCLUDED.phone, address = EXCLUDED.address;"]]{{RUN}}

**Verify upsert**:
```sql
SELECT * FROM customers WHERE email = 'alice@example.com';
```

[[gsql -d order_mgmt -p 5432 -c "SELECT * FROM customers WHERE email = 'alice@example.com';"]]{{RUN}}

**Expected**: Name updated to 'Alice Updated', phone changed to '555-9999'

---

### Task 5: Use RETURNING Clause

Let's use RETURNING to get data back from INSERT/UPDATE/DELETE.

**Insert with RETURNING**:
```sql
INSERT INTO orders (order_id, customer_id, total_amount, status)
VALUES (1004, 4, 200.00, 'pending')
RETURNING order_id, customer_id, total_amount, order_date;
```

[[gsql -d order_mgmt -p 5432 -c "INSERT INTO orders (order_id, customer_id, total_amount, status) VALUES (1004, 4, 200.00, 'pending') RETURNING order_id, customer_id, total_amount, order_date;"]]{{RUN}}

**Update with RETURNING**:
```sql
UPDATE orders 
SET total_amount = total_amount * 1.1,
    status = 'shipped'
WHERE order_id = 1004
RETURNING order_id, total_amount, status, (total_amount - (total_amount / 1.1)) AS original_amount;
```

[[gsql -d order_mgmt -p 5432 -c "UPDATE orders SET total_amount = total_amount * 1.1, status = 'shipped' WHERE order_id = 1004 RETURNING order_id, total_amount, status, (total_amount - (total_amount / 1.1)) AS original_amount;"]]{{RUN}}

**Delete with RETURNING**:
```sql
DELETE FROM order_items 
WHERE item_id = 2
RETURNING item_id, order_id, product_name, quantity, unit_price;
```

[[gsql -d order_mgmt -p 5432 -c "DELETE FROM order_items WHERE item_id = 2 RETURNING item_id, order_id, product_name, quantity, unit_price;"]]{{RUN}}

---

### Task 6: Advanced Queries with Subqueries

Let's write complex queries using subqueries.

**Find customers with orders above average**:
```sql
SELECT 
    c.customer_name,
    c.email,
    o.total_amount,
    (SELECT AVG(total_amount) FROM orders) AS avg_amount,
    round((o.total_amount - (SELECT AVG(total_amount) FROM orders)) / (SELECT AVG(total_amount) FROM orders) * 100, 2) AS percent_above_avg
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.total_amount > (SELECT AVG(total_amount) FROM orders)
ORDER BY o.total_amount DESC;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT c.customer_name, c.email, o.total_amount, (SELECT AVG(total_amount) FROM orders) AS avg_amount, round((o.total_amount - (SELECT AVG(total_amount) FROM orders)) / (SELECT AVG(total_amount) FROM orders) * 100, 2) AS percent_above_avg FROM customers c JOIN orders o ON c.customer_id = o.customer_id WHERE o.total_amount > (SELECT AVG(total_amount) FROM orders) ORDER BY o.total_amount DESC;"]]{{RUN}}

**Find duplicate orders (same customer, similar amount)**:
```sql
SELECT 
    o1.order_id AS order_1,
    o1.customer_id,
    o1.total_amount AS amount_1,
    o2.order_id AS order_2,
    o2.total_amount AS amount_2
FROM orders o1
JOIN orders o2 ON o1.customer_id = o2.customer_id
    AND o1.order_id < o2.order_id
WHERE abs(o1.total_amount - o2.total_amount) < 10
ORDER BY o1.customer_id, o1.order_id;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT o1.order_id AS order_1, o1.customer_id, o1.total_amount AS amount_1, o2.order_id AS order_2, o2.total_amount AS amount_2 FROM orders o1 JOIN orders o2 ON o1.customer_id = o2.customer_id AND o1.order_id < o2.order_id WHERE abs(o1.total_amount - o2.total_amount) < 10 ORDER BY o1.customer_id, o1.order_id;"]]{{RUN}}

---

### Task 7: Use CASE Expressions

Let's use CASE for conditional logic in queries.

**Categorize orders by amount**:
```sql
SELECT 
    order_id,
    customer_id,
    total_amount,
    CASE 
        WHEN total_amount < 50 THEN 'Small'
        WHEN total_amount < 150 THEN 'Medium'
        WHEN total_amount < 300 THEN 'Large'
        ELSE 'Very Large'
    END AS order_category,
    CASE 
        WHEN total_amount < 50 THEN 0.05
        WHEN total_amount < 150 THEN 0.10
        WHEN total_amount < 300 THEN 0.15
        ELSE 0.20
    END * total_amount AS discount_amount
FROM orders
ORDER BY total_amount DESC;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT order_id, customer_id, total_amount, CASE WHEN total_amount < 50 THEN 'Small' WHEN total_amount < 150 THEN 'Medium' WHEN total_amount < 300 THEN 'Large' ELSE 'Very Large' END AS order_category, CASE WHEN total_amount < 50 THEN 0.05 WHEN total_amount < 150 THEN 0.10 WHEN total_amount < 300 THEN 0.15 ELSE 0.20 END * total_amount AS discount_amount FROM orders ORDER BY total_amount DESC;"]]{{RUN}}

**Update order status based on age**:
```sql
UPDATE orders 
SET status = CASE 
    WHEN order_date < CURRENT_DATE - INTERVAL '30 days' THEN 'archived'
    WHEN order_date < CURRENT_DATE - INTERVAL '7 days' THEN 'old'
    ELSE status
END
WHERE order_date < CURRENT_DATE - INTERVAL '7 days';
```

[[gsql -d order_mgmt -p 5432 -c "UPDATE orders SET status = CASE WHEN order_date < CURRENT_DATE - INTERVAL '30 days' THEN 'archived' WHEN order_date < CURRENT_DATE - INTERVAL '7 days' THEN 'old' ELSE status END WHERE order_date < CURRENT_DATE - INTERVAL '7 days';"]]{{RUN}}

**Verify updates**:
```sql
SELECT order_id, status, order_date 
FROM orders 
WHERE order_date < CURRENT_DATE - INTERVAL '7 days'
ORDER BY order_date DESC;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT order_id, status, order_date FROM orders WHERE order_date < CURRENT_DATE - INTERVAL '7 days' ORDER BY order_date DESC;"]]{{RUN}}

---

### Task 8: Work with JSON Data

Let's create and query JSON data in GaussDB.

**Add JSON column to orders table**:
```sql
ALTER TABLE orders 
ADD COLUMN metadata JSONB;
```

[[gsql -d order_mgmt -p 5432 -c "ALTER TABLE orders ADD COLUMN metadata JSONB;"]]{{RUN}}

**Update orders with JSON metadata**:
```sql
UPDATE orders 
SET metadata = jsonb_build_object(
    'shipping_method', 'standard',
    'priority', CASE 
        WHEN total_amount > 200 THEN 'high'
        ELSE 'normal'
    END,
    'notes', 'Regular order'
)
WHERE metadata IS NULL;
```

[[gsql -d order_mgmt -p 5432 -c "UPDATE orders SET metadata = jsonb_build_object('shipping_method', 'standard', 'priority', CASE WHEN total_amount > 200 THEN 'high' ELSE 'normal' END, 'notes', 'Regular order') WHERE metadata IS NULL;"]]{{RUN}}

**Query JSON data**:
```sql
SELECT 
    order_id,
    total_amount,
    metadata->>'shipping_method' AS shipping_method,
    metadata->>'priority' AS priority,
    metadata->>'notes' AS notes
FROM orders
WHERE metadata IS NOT NULL
ORDER BY order_id;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT order_id, total_amount, metadata->>'shipping_method' AS shipping_method, metadata->>'priority' AS priority, metadata->>'notes' AS notes FROM orders WHERE metadata IS NOT NULL ORDER BY order_id;"]]{{RUN}}

**Query using JSON operators**:
```sql
SELECT 
    order_id,
    total_amount,
    metadata
FROM orders
WHERE metadata @> '{"priority": "high"}'::jsonb
ORDER BY total_amount DESC;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT order_id, total_amount, metadata FROM orders WHERE metadata @> '{\"priority\": \"high\"}'::jsonb ORDER BY total_amount DESC;"]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Created views for data abstraction
- [ ] Task 2: Created indexes for performance
- [ ] Task 3: Added table constraints (CHECK, UNIQUE)
- [ ] Task 4: Performed UPSERT operations with ON CONFLICT
- [ ] Task 5: Used RETURNING clause for data validation
- [ ] Task 6: Wrote advanced queries with subqueries
- [ ] Task 7: Used CASE expressions for conditional logic
- [ ] Task 8: Worked with JSON data type

## Review Questions

1. **What is the purpose of a view in SQL?**
   - [ ] Store data
   - [ ] Simplify complex queries and implement security
   - [ ] Improve performance
   - [ ] Enforce constraints

2. **What does UPSERT achieve with ON CONFLICT?**
   - [ ] Delete conflicting rows
   - [ ] Insert or update on duplicate key violation
   - [ ] Only insert new rows
   - [ ] Only update existing rows

3. **What does the RETURNING clause do?**
   - [ ] Logs the operation
   - [ ] Returns data affected by INSERT/UPDATE/DELETE
   - [ ] Validates data before commit
   - [ ] Calculates aggregate values

4. **What JSON operator @> does in GaussDB?**
   - [ ] Extracts JSON field
   - [ ] Checks if left JSON contains right JSON
   - [ ] Merges two JSON objects
   - [ ] Converts JSON to string

## Summary

In this L2 lab, you practiced:
- **Views**: Creating and querying views for data abstraction
- **Indexes**: Creating single and composite indexes for performance
- **Constraints**: Adding CHECK and UNIQUE constraints
- **UPSERT**: Using INSERT...ON CONFLICT for upsert operations
- **RETURNING**: Getting affected data from DML operations
- **Subqueries**: Writing complex queries with nested queries
- **CASE**: Using CASE for conditional logic
- **JSON**: Working with JSONB data type and operators

These advanced SQL operations enable you to write sophisticated queries and manage complex data in GaussDB.

## Next Steps

Proceed to **L3 Lab** to practice advanced SQL operations including:
- Common Table Expressions (CTEs)
- Window functions for advanced analytics
- Recursive queries for hierarchical data
- Advanced JSON operations
- Stored procedures and functions
