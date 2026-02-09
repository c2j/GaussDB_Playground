# SQL Development Module - L1 Lab: Basic SQL Operations

## Lab Overview

In this L1 (Entry Level) lab, you will practice basic SQL operations in GaussDB, including:
- Creating a database and tables
- Inserting and querying data
- Using basic data types and operators
- Performing simple DDL and DML operations

**Time Required**: 25 minutes
**Prerequisites**: GaussDB running with gsql client available

## Learning Objectives

By completing this lab, you will be able to:
- Create and manage database objects (databases, tables)
- Insert, update, and delete data
- Write basic SELECT queries with filtering and sorting
- Understand and use common data types in GaussDB

## Lab Tasks

### Task 1: Create Database and Connect

Let's create a practice database for our SQL exercises.

**Create a new database**:
```sql
CREATE DATABASE order_mgmt;
```

[[gsql -d postgres -p 5432 -c "CREATE DATABASE order_mgmt;"]]{{RUN}}

**Connect to the new database**:
```bash
gsql -d order_mgmt -p 5432
```

[[gsql -d order_mgmt -p 5432 -c "SELECT current_database();"]]{{RUN}}

**Verification**: Should return `order_mgmt` as the current database

---

### Task 2: Create Tables with Different Data Types

Let's create tables for an order management system using various GaussDB data types.

**Create customers table**:
```sql
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active'
);
```

[[gsql -d order_mgmt -p 5432 -c "CREATE TABLE customers (customer_id INT PRIMARY KEY, customer_name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE, phone VARCHAR(20), address TEXT, registration_date DATE DEFAULT CURRENT_DATE, status VARCHAR(20) DEFAULT 'active');"]]{{RUN}}

**Create orders table**:
```sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'pending'
);
```

[[gsql -d order_mgmt -p 5432 -c "CREATE TABLE orders (order_id INT PRIMARY KEY, customer_id INT REFERENCES customers(customer_id), order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, total_amount NUMERIC(10, 2), status VARCHAR(20) DEFAULT 'pending');"]]{{RUN}}

**Create order_items table**:
```sql
CREATE TABLE order_items (
    item_id INT PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    product_name VARCHAR(100),
    quantity INT,
    unit_price NUMERIC(10, 2)
);
```

[[gsql -d order_mgmt -p 5432 -c "CREATE TABLE order_items (item_id INT PRIMARY KEY, order_id INT REFERENCES orders(order_id), product_name VARCHAR(100), quantity INT, unit_price NUMERIC(10, 2));"]]{{RUN}}

**Verification**:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"]]{{RUN}}

---

### Task 3: Insert Data Using Different Methods

Let's insert data into our tables using various INSERT methods.

**Insert a single row into customers**:
```sql
INSERT INTO customers (customer_id, customer_name, email, phone, address)
VALUES (1, 'John Smith', 'john@example.com', '123-456-7890', '123 Main St, City');
```

[[gsql -d order_mgmt -p 5432 -c "INSERT INTO customers (customer_id, customer_name, email, phone, address) VALUES (1, 'John Smith', 'john@example.com', '123-456-7890', '123 Main St, City');"]]{{RUN}}

**Insert multiple rows using VALUES**:
```sql
INSERT INTO customers (customer_id, customer_name, email, phone)
VALUES 
    (2, 'Jane Doe', 'jane@example.com', '234-567-8901'),
    (3, 'Bob Johnson', 'bob@example.com', '345-678-9012');
```

[[gsql -d order_mgmt -p 5432 -c "INSERT INTO customers (customer_id, customer_name, email, phone) VALUES (2, 'Jane Doe', 'jane@example.com', '234-567-8901'), (3, 'Bob Johnson', 'bob@example.com', '345-678-9012');"]]{{RUN}}

**Insert orders**:
```sql
INSERT INTO orders (order_id, customer_id, total_amount, status)
VALUES 
    (1001, 1, 150.00, 'completed'),
    (1002, 2, 250.50, 'completed'),
    (1003, 1, 75.00, 'pending');
```

[[gsql -d order_mgmt -p 5432 -c "INSERT INTO orders (order_id, customer_id, total_amount, status) VALUES (1001, 1, 150.00, 'completed'), (1002, 2, 250.50, 'completed'), (1003, 1, 75.00, 'pending');"]]{{RUN}}

**Insert order items**:
```sql
INSERT INTO order_items (item_id, order_id, product_name, quantity, unit_price)
VALUES 
    (1, 1001, 'Product A', 2, 25.00),
    (2, 1001, 'Product B', 1, 100.00),
    (3, 1002, 'Product C', 5, 50.10),
    (4, 1003, 'Product A', 3, 25.00);
```

[[gsql -d order_mgmt -p 5432 -c "INSERT INTO order_items (item_id, order_id, product_name, quantity, unit_price) VALUES (1, 1001, 'Product A', 2, 25.00), (2, 1001, 'Product B', 1, 100.00), (3, 1002, 'Product C', 5, 50.10), (4, 1003, 'Product A', 3, 25.00);"]]{{RUN}}

**Verification - Check row counts**:
```sql
SELECT 'customers' AS table_name, count(*) AS row_count FROM customers
UNION ALL
SELECT 'orders', count(*) FROM orders
UNION ALL
SELECT 'order_items', count(*) FROM order_items
ORDER BY table_name;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT 'customers' AS table_name, count(*) AS row_count FROM customers UNION ALL SELECT 'orders', count(*) FROM orders UNION ALL SELECT 'order_items', count(*) FROM order_items ORDER BY table_name;"]]{{RUN}}

---

### Task 4: Query Data with Basic SELECT

Let's query the data we inserted using various SELECT techniques.

**Select all columns from customers**:
```sql
SELECT * FROM customers;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT * FROM customers;"]]{{RUN}}

**Select specific columns**:
```sql
SELECT customer_id, customer_name, email 
FROM customers 
WHERE status = 'active';
```

[[gsql -d order_mgmt -p 5432 -c "SELECT customer_id, customer_name, email FROM customers WHERE status = 'active';"]]{{RUN}}

**Use ORDER BY**:
```sql
SELECT customer_name, registration_date 
FROM customers 
ORDER BY registration_date DESC;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT customer_name, registration_date FROM customers ORDER BY registration_date DESC;"]]{{RUN}}

**Use LIMIT**:
```sql
SELECT customer_id, customer_name 
FROM customers 
ORDER BY customer_id 
LIMIT 2;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT customer_id, customer_name FROM customers ORDER BY customer_id LIMIT 2;"]]{{RUN}}

---

### Task 5: Use Aggregate Functions

Let's calculate statistics about our data using aggregate functions.

**Calculate total orders per customer**:
```sql
SELECT 
    c.customer_name,
    count(o.order_id) AS total_orders,
    sum(o.total_amount) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name
ORDER BY total_spent DESC;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT c.customer_name, count(o.order_id) AS total_orders, sum(o.total_amount) AS total_spent FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.customer_name ORDER BY total_spent DESC;"]]{{RUN}}

**Find average order value**:
```sql
SELECT 
    avg(total_amount) AS avg_order_value,
    min(total_amount) AS min_order,
    max(total_amount) AS max_order,
    sum(total_amount) AS total_revenue
FROM orders;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT avg(total_amount) AS avg_order_value, min(total_amount) AS min_order, max(total_amount) AS max_order, sum(total_amount) AS total_revenue FROM orders;"]]{{RUN}}

**Count orders by status**:
```sql
SELECT 
    status,
    count(*) AS order_count
FROM orders
GROUP BY status;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT status, count(*) AS order_count FROM orders GROUP BY status;"]]{{RUN}}

---

### Task 6: Update and Delete Data

Let's modify and remove data using UPDATE and DELETE operations.

**Update order status**:
```sql
UPDATE orders 
SET status = 'shipped' 
WHERE order_id = 1003;
```

[[gsql -d order_mgmt -p 5432 -c "UPDATE orders SET status = 'shipped' WHERE order_id = 1003;"]]{{RUN}}

**Verification**:
```sql
SELECT order_id, status 
FROM orders 
WHERE order_id = 1003;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT order_id, status FROM orders WHERE order_id = 1003;"]]{{RUN}}

**Update multiple columns**:
```sql
UPDATE customers 
SET phone = '999-888-7777', 
    status = 'premium' 
WHERE customer_id = 1;
```

[[gsql -d order_mgmt -p 5432 -c "UPDATE customers SET phone = '999-888-7777', status = 'premium' WHERE customer_id = 1;"]]{{RUN}}

**Delete a specific order item**:
```sql
DELETE FROM order_items 
WHERE item_id = 2;
```

[[gsql -d order_mgmt -p 5432 -c "DELETE FROM order_items WHERE item_id = 2;"]]{{RUN}}

**Verification**:
```sql
SELECT count(*) AS remaining_items 
FROM order_items;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT count(*) AS remaining_items FROM order_items;"]]{{RUN}}

---

### Task 7: Use String Functions and Type Conversion

Let's practice using built-in functions and type conversion.

**String functions**:
```sql
SELECT 
    customer_name,
    upper(customer_name) AS upper_name,
    lower(customer_name) AS lower_name,
    length(customer_name) AS name_length,
    substring(customer_name, 1, 5) AS first_5_chars
FROM customers;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT customer_name, upper(customer_name) AS upper_name, lower(customer_name) AS lower_name, length(customer_name) AS name_length, substring(customer_name, 1, 5) AS first_5_chars FROM customers;"]]{{RUN}}

**Date functions**:
```sql
SELECT 
    order_id,
    order_date,
    extract(year from order_date) AS order_year,
    extract(month from order_date) AS order_month,
    extract(day from order_date) AS order_day,
    date_trunc('day', order_date) AS order_day_only
FROM orders;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT order_id, order_date, extract(year from order_date) AS order_year, extract(month from order_date) AS order_month, extract(day from order_date) AS order_day, date_trunc('day', order_date) AS order_day_only FROM orders;"]]{{RUN}}

**Type conversion**:
```sql
SELECT 
    order_id,
    total_amount,
    cast(total_amount AS INT) AS amount_int,
    total_amount::TEXT AS amount_text
FROM orders;
```

[[gsql -d order_mgmt -p 5432 -c "SELECT order_id, total_amount, cast(total_amount AS INT) AS amount_int, total_amount::TEXT AS amount_text FROM orders;"]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Created and connected to order_mgmt database
- [ ] Task 2: Created customers, orders, and order_items tables
- [ ] Task 3: Inserted sample data into all tables
- [ ] Task 4: Queried data using SELECT, WHERE, ORDER BY, LIMIT
- [ ] Task 5: Used aggregate functions (SUM, AVG, COUNT, MIN, MAX)
- [ ] Task 6: Updated and deleted data using UPDATE and DELETE
- [ ] Task 7: Applied string functions and type conversion

## Review Questions

1. **Which data type is best for storing monetary values in GaussDB?**
   - [ ] FLOAT
   - [ ] DOUBLE PRECISION
   - [ ] NUMERIC(10, 2)
   - [ ] INT

2. **What is the purpose of the REFERENCES constraint in table definition?**
   - [ ] Creates an index
   - [ ] Establishes a foreign key relationship
   - [ ] Sets a default value
   - [ ] Makes a column unique

3. **Which aggregate function calculates the average value?**
   - [ ] SUM()
   - [ ] AVG()
   - [ ] COUNT()
   - [ ] MAX()

4. **What does the LIMIT clause do in a SELECT query?**
   - [ ] Filters rows
   - [ ] Sorts rows
   - [ ] Restricts number of rows returned
   - [ ] Groups rows

## Summary

In this L1 lab, you practiced:
- **DDL Operations**: Created databases and tables with constraints
- **DML Operations**: Inserted, updated, and deleted data
- **Querying**: Wrote SELECT queries with filtering, sorting, and joins
- **Data Types**: Used VARCHAR, INT, NUMERIC, DATE, TIMESTAMP, TEXT
- **Functions**: Applied string, date, and type conversion functions
- **Aggregation**: Used aggregate functions for data analysis

These basic SQL operations form the foundation for database development in GaussDB.

## Next Steps

Proceed to **L2 Lab** to practice intermediate SQL operations including:
- Advanced DDL operations (ALTER TABLE, indexes, views)
- Complex DML operations (UPSERT, RETURNING, batch operations)
- Advanced querying with subqueries and CASE expressions
- Working with NULL values and conditional logic
