# DML 操作

## INSERT

### 基本语法

```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);
```

### 插入单条记录

```sql
INSERT INTO users (user_id, username, email)
VALUES (1, 'zhangsan', 'zhangsan@example.com');
```

### 批量插入

```sql
INSERT INTO users (user_id, username, email)
VALUES
    (2, 'lisi', 'lisi@example.com'),
    (3, 'wangwu', 'wangwu@example.com'),
    (4, 'zhaoliu', 'zhaoliu@example.com');
```

### 从查询插入

```sql
INSERT INTO active_users (user_id, username, email)
SELECT user_id, username, email
FROM users
WHERE create_time > '2024-01-01';
```

### 使用默认值

```sql
INSERT INTO orders (order_id, user_id, product_id)
VALUES (1, 1, 1);
-- quantity, order_date, status 会使用默认值
```

### 返回插入的数据

```sql
INSERT INTO users (username, email)
VALUES ('newuser', 'new@example.com')
RETURNING user_id, username;
```

## UPDATE

### 基本语法

```sql
UPDATE table_name
SET column1 = value1, column2 = value2, ...
WHERE condition;
```

### 更新单条记录

```sql
UPDATE users
SET email = 'newemail@example.com'
WHERE user_id = 1;
```

### 更新多个字段

```sql
UPDATE users
SET email = 'newemail@example.com', username = 'newname'
WHERE user_id = 1;
```

### 批量更新

```sql
UPDATE orders
SET status = 'shipped'
WHERE status = 'pending' AND order_date < '2024-01-01';
```

### 使用表达式

```sql
UPDATE products
SET price = price * 1.1
WHERE category = 'electronics';
```

## DELETE

### 基本语法

```sql
DELETE FROM table_name
WHERE condition;
```

### 删除单条记录

```sql
DELETE FROM users
WHERE user_id = 1;
```

### 批量删除

```sql
DELETE FROM orders
WHERE status = 'cancelled' AND order_date < '2023-01-01';
```

### 删除所有数据（清空表）

```sql
DELETE FROM table_name;
```

### 使用 TRUNCATE（更快）

```sql
TRUNCATE TABLE table_name;
```

**TRUNCATE vs DELETE**:
- `TRUNCATE`: 更快，不可回滚，不能带 WHERE 子句，重置序列
- `DELETE`: 较慢，可以回滚，可以带 WHERE 子句，保留序列值

## RETURNING 子句

### INSERT 时返回

```sql
INSERT INTO users (username, email)
VALUES ('newuser', 'new@example.com')
RETURNING user_id, username, create_time;
```

### UPDATE 时返回

```sql
UPDATE products
SET price = price * 1.1
WHERE product_id = 1
RETURNING product_id, name, price;
```

### DELETE 时返回

```sql
DELETE FROM orders
WHERE order_id = 1
RETURNING order_id, user_id, total_amount;
```

## UPSERT (INSERT ... ON CONFLICT)

### 基本语法

```sql
INSERT INTO table_name (columns)
VALUES (values)
ON CONFLICT (unique_column) DO UPDATE SET column1 = value1, ...;
```

### 示例

```sql
INSERT INTO users (user_id, username, email)
VALUES (1, 'zhangsan', 'zhangsan@example.com')
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email, username = EXCLUDED.username;
```

### 不冲突时插入，冲突时忽略

```sql
INSERT INTO users (user_id, username, email)
VALUES (1, 'zhangsan', 'zhangsan@example.com')
ON CONFLICT (user_id) DO NOTHING;
```

## Tips

**DML 最佳实践**：
- 始终使用 WHERE 子句指定更新/删除条件（除非有意更新/删除全部）
- 在 WHERE 子句中使用主键或唯一索引提高性能
- 批量操作时使用事务保证数据一致性
- 使用 EXCLUDED 引用冲突行的值（UPSERT 场景）
- 谨试时先使用 SELECT 验证数据

**性能考虑**：
- 批量插入比单条插入更快
- TRUNCATE 比 DELETE 清空大表更快
- UPDATE/DELETE 使用索引列作为条件
- 大量操作考虑分批提交事务

**企业规范**：
- [ ] DML 操作前先备份数据
- [ ] 使用事务保证数据一致性
- [ ] 在 WHERE 中使用主键或唯一索引
- [ ] 批量操作使用合适的提交频率
- [ ] 记录关键操作的日志
- [ ] 考虑并发和锁问题

## 任务

插入测试数据到 users 表：

```
[[INSERT INTO users (user_id, username, email) VALUES
    (1, 'zhangsan', 'zhangsan@example.com'),
    (2, 'lisi', 'lisi@example.com'),
    (3, 'wangwu', 'wangwu@example.com'),
    (4, 'zhaoliu', 'zhaoliu@example.com'),
    (5, 'sunqi', 'sunqi@example.com');]]{{RUN}}
```

插入测试数据到 products 表：

```
[[INSERT INTO products (product_id, name, price, stock, category) VALUES
    (1, 'Laptop', 5999.99, 50, 'electronics'),
    (2, 'Mouse', 49.99, 200, 'electronics'),
    (3, 'Keyboard', 79.99, 150, 'electronics'),
    (4, 'Monitor', 299.99, 80, 'electronics'),
    (5, 'Headphones', 199.99, 100, 'electronics');]]{{RUN}}
```

插入订单数据：

```
[[INSERT INTO orders (order_id, user_id, product_id, quantity, status) VALUES
    (1, 1, 1, 2, 'shipped'),
    (2, 2, 2, 5, 'pending'),
    (3, 1, 3, 1, 'completed'),
    (4, 3, 4, 3, 'shipped'),
    (5, 2, 5, 10, 'pending');]]{{RUN}}
```

查询验证插入的数据：

`[[SELECT * FROM users ORDER BY user_id;]]{{RUN}}`

`[[SELECT * FROM products ORDER BY product_id;]]{{RUN}}`

`[[SELECT * FROM orders ORDER BY order_id;]]{{RUN}}`

更新订单状态：

`[[UPDATE orders SET status = 'completed' WHERE user_id = 2;]]{{RUN}}`

查询验证更新：

`[[SELECT * FROM orders WHERE user_id = 2;]]{{RUN}}`

更新产品价格（10% 涨价）：

`[[UPDATE products SET price = price * 1.1 WHERE category = 'electronics';]]{{RUN}}`

查询验证更新：

`[[SELECT name, price FROM products WHERE category = 'electronics';]]{{RUN}}`

测试 UPSERT（插入或更新）：

```
[[INSERT INTO users (user_id, username, email)
VALUES (1, 'zhangsan_updated', 'zhangsan_new@example.com')
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email;]]{{RUN}}
```

查询验证：

`[[SELECT * FROM users WHERE user_id = 1;]]{{RUN}}`

删除测试数据：

`[[DELETE FROM orders WHERE order_id = 5;]]{{RUN}}`

查询验证删除：

`[[SELECT * FROM orders WHERE order_id = 5;]]{{RUN}}`

使用 RETURNING：

```
[[INSERT INTO users (username, email)
VALUES ('testuser', 'test@example.com')
RETURNING user_id, username, create_time;]]{{RUN}}
```

## 错误演示

忘记 WHERE 子句：

`[[UPDATE users SET email = 'error@example.com';]]{{PRINT}}`

说明：这会更新所有用户的 email！必须使用 WHERE 子句。

删除不存在的记录：

`[[DELETE FROM users WHERE user_id = 999;]]{{RUN}}`

说明：这不会报错，只是没有记录被删除。可以检查受影响的行数。

违反约束的插入：

```
[[INSERT INTO orders (order_id, user_id, product_id) VALUES (6, 999, 1);]]{{PRINT}}
```

说明：user_id=999 不存在，违反外键约束。
