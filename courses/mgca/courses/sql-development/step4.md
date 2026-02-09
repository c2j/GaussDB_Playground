# 查询和连接

## SELECT 基础

### 基本语法

```sql
SELECT column1, column2, ...
FROM table_name
WHERE condition
ORDER BY column_name
LIMIT number;
```

### 查询所有列

```sql
SELECT * FROM users;
```

### 查询指定列

```sql
SELECT user_id, username, email FROM users;
```

### 使用 WHERE 子句

```sql
SELECT * FROM products WHERE price > 500;
```

### 使用 ORDER BY

```sql
SELECT * FROM orders ORDER BY order_date DESC;
```

### 使用 LIMIT

```sql
SELECT * FROM products ORDER BY price DESC LIMIT 5;
```

## 聚合函数

### COUNT

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT category) FROM products;
```

### SUM

```sql
SELECT SUM(price) AS total_value FROM products;
SELECT SUM(quantity * price) AS total FROM orders;
```

### AVG

```sql
SELECT AVG(price) AS avg_price FROM products;
```

### MAX/MIN

```sql
SELECT MAX(price), MIN(price) FROM products;
```

## GROUP BY

### 基本分组

```sql
SELECT category, COUNT(*), AVG(price)
FROM products
GROUP BY category;
```

### 分组统计

```sql
SELECT
    u.user_id,
    u.username,
    COUNT(o.order_id) AS order_count,
    SUM(o.quantity * p.price) AS total_spent
FROM users u
JOIN orders o ON u.user_id = o.user_id
JOIN products p ON o.product_id = p.product_id
GROUP BY u.user_id, u.username
ORDER BY total_spent DESC;
```

### HAVING 子句

```sql
SELECT category, COUNT(*), AVG(price)
FROM products
GROUP BY category
HAVING COUNT(*) > 10;
```

**HAVING vs WHERE**:
- `WHERE`: 在分组前过滤行
- `HAVING`: 在分组后过滤组

## 表连接

### INNER JOIN

```sql
SELECT u.username, p.name, o.order_date
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id
INNER JOIN products p ON o.product_id = p.product_id;
```

### LEFT JOIN

```sql
SELECT u.username, COUNT(o.order_id) AS order_count
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.username;
```

**LEFT JOIN vs INNER JOIN**:
- `INNER JOIN`: 只返回匹配的行
- `LEFT JOIN`: 返回左表所有行，右表不匹配的显示 NULL

### RIGHT JOIN

```sql
SELECT u.username, o.order_id
FROM users u
RIGHT JOIN orders o ON u.user_id = o.user_id;
```

### FULL JOIN

```sql
SELECT u.username, o.order_id
FROM users u
FULL OUTER JOIN orders o ON u.user_id = o.user_id;
```

### SELF JOIN

```sql
SELECT
    o1.order_id,
    o1.user_id,
    o2.order_id AS next_order
FROM orders o1
LEFT JOIN orders o2 ON o1.user_id = o2.user_id AND o1.order_id < o2.order_id;
```

## 子查询

### WHERE 子查询

```sql
SELECT * FROM products
WHERE price > (
    SELECT AVG(price) FROM products
);
```

### FROM 子查询

```sql
SELECT * FROM (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
) AS user_order_counts
WHERE order_count > 5;
```

### EXISTS 子查询

```sql
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.user_id
);
```

### IN 子查询

```sql
SELECT * FROM products
WHERE category IN (
    SELECT DISTINCT category FROM products WHERE price > 500
);
```

## UNION

### UNION (去重)

```sql
SELECT username FROM users
UNION
SELECT name FROM admins;
```

### UNION ALL (保留重复）

```sql
SELECT username FROM users
UNION ALL
SELECT name FROM admins;
```

## CASE 表达式

```sql
SELECT
    product_id,
    name,
    price,
    CASE
        WHEN price < 100 THEN 'Cheap'
        WHEN price < 500 THEN 'Medium'
        ELSE 'Expensive'
    END AS price_category
FROM products;
```

### 分组统计

```sql
SELECT
    CASE
        WHEN status = 'pending' THEN 'Pending'
        WHEN status = 'shipped' THEN 'Shipped'
        ELSE 'Other'
    END AS order_status,
    COUNT(*)
FROM orders
GROUP BY
    CASE
        WHEN status = 'pending' THEN 'Pending'
        WHEN status = 'shipped' THEN 'Shipped'
        ELSE 'Other'
    END;
```

## Tips

**查询优化**：
- 只查询需要的列，避免 SELECT *
- 在 WHERE 子句中使用索引列
- 使用 JOIN 而非子查询（多数情况下）
- 使用 LIMIT 限制结果集大小
- 避免在 WHERE 中使用函数（会导致索引失效）

**性能考虑**：
- INNER JOIN 比 OUTER JOIN 更快
- EXISTS 通常比 IN 性能更好（特别是子查询结果大时）
- GROUP BY + HAVING 配合使用
- 合理使用索引提高查询速度

**企业规范**：
- [ ] 只查询必要的列
- [ ] 使用 WHERE 限制结果集
- [ ] 合理使用 JOIN 避免 N+1 查询
- [ ] 子查询优先考虑 EXISTS 或 IN
- [ ] 使用索引列作为查询条件
- [ ] 使用 LIMIT 限制结果集大小
- [ ] 复杂查询先使用 EXPLAIN 分析

## 任务

基础查询：

`[[SELECT * FROM users;]]{{RUN}}`

`[[SELECT user_id, username FROM users;]]{{RUN}}`

`[[SELECT * FROM products WHERE price > 100 ORDER BY price DESC LIMIT 3;]]{{RUN}}`

聚合查询：

`[[SELECT category, COUNT(*), AVG(price) FROM products GROUP BY category;]]{{RUN}}`

`[[SELECT u.username, COUNT(o.order_id) AS order_count FROM users u LEFT JOIN orders o ON u.user_id = o.user_id GROUP BY u.user_id, u.username;]]{{RUN}}`

连接查询：

`[[SELECT u.username, p.name, o.quantity FROM users u JOIN orders o ON u.user_id = o.user_id JOIN products p ON o.product_id = p.product_id;]]{{RUN}}`

子查询：

`[[SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);]]{{RUN}}`

`[[SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.user_id);]]{{RUN}}`

CASE 表达式：

```
[[
SELECT
    product_id,
    name,
    price,
    CASE
        WHEN price < 100 THEN 'Low'
        WHEN price < 500 THEN 'Medium'
        ELSE 'High'
    END AS price_level
FROM products;
]]{{RUN}}
```

UNION：

```
[[
SELECT user_id, username FROM users
UNION ALL
SELECT admin_id, username FROM admins;
]]{{RUN}}
```

**自动评分**：验证查询结果正确，使用 EXPLAIN 分析查询计划是否使用了索引。
