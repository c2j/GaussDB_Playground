# 高级 SQL 特性

## CTE (Common Table Expressions)

### 基本语法

```sql
WITH cte_name AS (
    SELECT ...
)
SELECT ... FROM cte_name;
```

### 简单 CTE

```sql
WITH user_orders AS (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
)
SELECT u.username, o.order_count
FROM users u
JOIN user_orders o ON u.user_id = o.user_id
WHERE o.order_count > 2;
```

### 多个 CTE

```sql
WITH
    user_stats AS (
        SELECT user_id, COUNT(*) AS order_count
        FROM orders
        GROUP BY user_id
    ),
    product_stats AS (
        SELECT product_id, COUNT(*) AS order_count
        FROM orders
        GROUP BY product_id
    )
SELECT us.user_id, ps.product_id
FROM user_stats us
CROSS JOIN product_stats ps
WHERE us.order_count > 2 AND ps.order_count > 3;
```

### CTE 更新数据

```sql
WITH products_to_update AS (
    SELECT product_id
    FROM products
    WHERE stock < 10
)
UPDATE products
SET price = price * 0.9
WHERE product_id IN (SELECT product_id FROM products_to_update);
```

## 窗口函数

### 概述

窗口函数在结果集上执行计算，不减少行数。

### ROW_NUMBER()

```sql
SELECT
    order_id,
    user_id,
    amount,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date) AS row_num
FROM orders;
```

### RANK()

```sql
SELECT
    user_id,
    order_id,
    amount,
    RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rank
FROM orders;
```

### DENSE_RANK()

```sql
SELECT
    user_id,
    order_id,
    amount,
    DENSE_RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS dense_rank
FROM orders;
```

### LAG() 和 LEAD()

```sql
SELECT
    order_date,
    amount,
    LAG(amount) OVER (ORDER BY order_date) AS prev_amount,
    LEAD(amount) OVER (ORDER BY order_date) AS next_amount
FROM orders
ORDER BY order_date;
```

### SUM() OVER()

```sql
SELECT
    order_date,
    amount,
    SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders
ORDER BY order_date;
```

### 窗口子句

```sql
SELECT
    order_date,
    amount,
    SUM(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg
FROM orders
ORDER BY order_date;
```

## 递归查询

### 递归 CTE

```sql
WITH RECURSIVE category_tree AS (
    -- 基础查询
    SELECT category_id, parent_id, name, 1 AS level
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- 递归查询
    SELECT c.category_id, c.parent_id, c.name, ct.level + 1
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.category_id
)
SELECT * FROM category_tree ORDER BY level, name;
```

## 分析函数

### PERCENT_RANK()

```sql
SELECT
    user_id,
    amount,
    PERCENT_RANK() OVER (ORDER BY amount) AS percent_rank
FROM sales;
```

### NTILE()

```sql
SELECT
    user_id,
    amount,
    NTILE(4) OVER (ORDER BY amount) AS quartile
FROM sales;
```

### FIRST_VALUE() 和 LAST_VALUE()

```sql
SELECT
    order_date,
    amount,
    FIRST_VALUE(amount) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS first_amount,
    LAST_VALUE(amount) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_amount
FROM orders
ORDER BY order_date;
```

## 数组函数

### ARRAY_AGG()

```sql
SELECT
    user_id,
    ARRAY_AGG(product_id) AS product_ids
FROM orders
GROUP BY user_id;
```

### UNNEST()

```sql
SELECT
    user_id,
    UNNEST(product_ids) AS product_id
FROM user_product_arrays;
```

## JSON 函数

### JSON 操作

```sql
-- 创建 JSON 对象
SELECT json_build_object('name', 'Product A', 'price', 99.99);

-- 提取 JSON 值
SELECT json_extract_path_text('{"name": "Product A", "price": 99.99}', '$.name');

-- 解析 JSON 列
SELECT
    json_data->>'name' AS name,
    (json_data->>'price')::NUMERIC AS price
FROM products
WHERE json_data IS NOT NULL;
```

## Tips

**高级 SQL 最佳实践**：
- 使用 CTE 提高查询可读性
- 窗口函数用于排名和计算，避免子查询
- 递归查询处理层次数据（组织结构、分类树）
- 合理使用 PARTITION BY 和 ORDER BY
- 理解窗口子句的作用域

**性能考虑**：
- CTE 通常会被物化，多次引用更高效
- 窗口函数不减少行数，可能影响性能
- 递归查询限制深度，避免无限循环
- 大数据集谨慎使用窗口函数

**企业规范**：
- [ ] 使用 CTE 提高复杂查询的可读性
- [ ] 窗口函数用于排名和累计计算
- [ ] 递归查询处理层次数据
- [ ] 使用 EXPLAIN ANALYZE 分析性能
- [ ] 合理使用 PARTITION BY 避免全表扫描
- [ ] 文档化复杂查询逻辑

## 任务

创建测试数据（层次结构）：

```
[[
CREATE TABLE categories (
    category_id INT PRIMARY KEY,
    parent_id INT REFERENCES categories(category_id),
    name VARCHAR(50)
);]]{{RUN}}
```

插入分类数据：

```
[[
INSERT INTO categories VALUES
    (1, NULL, 'Electronics'),
    (2, NULL, 'Clothing'),
    (3, 1, 'Laptops'),
    (4, 1, 'Phones'),
    (5, 1, 'Accessories'),
    (6, 3, 'Gaming Laptops'),
    (7, 3, 'Business Laptops'),
    (8, 4, 'Smartphones'),
    (9, 5, 'Mouse'),
    (10, 5, 'Keyboard');]]{{RUN}}
```

使用 CTE 查询：

```
[[
WITH category_hierarchy AS (
    SELECT
        category_id,
        parent_id,
        name,
        1 AS level
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT
        c.category_id,
        c.parent_id,
        c.name,
        ch.level + 1
    FROM categories c
    JOIN category_hierarchy ch ON c.parent_id = ch.category_id
)
SELECT * FROM category_hierarchy ORDER BY level, name;
]]{{RUN}}
```

使用窗口函数：

```
[[
SELECT
    order_id,
    user_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date) AS row_num,
    LAG(amount) OVER (PARTITION BY user_id ORDER BY order_date) AS prev_amount,
    SUM(amount) OVER (PARTITION BY user_id ORDER BY order_date) AS running_total
FROM orders
ORDER BY user_id, order_date;
]]{{RUN}}
```

使用数组函数：

```
[[
SELECT
    user_id,
    ARRAY_AGG(DISTINCT product_id) AS unique_products
FROM orders
GROUP BY user_id;
]]{{RUN}}
```

## 错误演示

无限递归（缺少终止条件）：

```
[[
WITH RECURSIVE infinite_loop AS (
    SELECT 1 AS n
    
    UNION ALL
    
    SELECT n + 1 FROM infinite_loop
)
SELECT * FROM infinite_loop;
]]{{PRINT}}
```

说明：递归查询必须有终止条件，否则会无限循环。

窗口函数使用不当：

```
[[
SELECT
    order_id,
    amount,
    ROW_NUMBER() OVER (ORDER BY amount) AS row_num,
    RANK() OVER (ORDER BY amount) AS rank
FROM orders
WHERE amount > 100;
]]{{PRINT}}
```

说明：WHERE 子句在窗口函数之后应用，这可能不是预期结果。应该在窗口函数中使用子查询。
