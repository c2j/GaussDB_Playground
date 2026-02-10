# 查询优化（EXPLAIN）

## EXPLAIN 基础

### 作用
- **分析执行计划**: 了解数据库如何执行查询
- **识别性能问题**: 发现全表扫描、排序等性能瓶颈
- **验证索引使用**: 确认索引是否被使用
- **比较不同方案**: 测试不同 SQL 写法的性能差异

### 基本语法

```sql
EXPLAIN query;
```

显示估算的执行计划，不实际执行查询。

### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE query;
```

实际执行查询并返回真实的执行统计，包括实际时间和行数。

## 执行计划解读

### 执行计划结构

```
QUERY PLAN
---------------------------------------------------------------------------
 Index Scan using idx_users_email on users
   Index Cond: (email = 'test@example.com')
   Rows Removed by Filter: 100
   Heap Fetches: 1
(1 row)
```

### 常见节点类型

**Seq Scan**: 顺序扫描（全表扫描）
```sql
EXPLAIN SELECT * FROM users WHERE username LIKE '%zhang%';
```

**Index Scan**: 索引扫描
```sql
EXPLAIN SELECT * FROM users WHERE user_id = 1;
```

**Index Only Scan**: 只索引扫描（不需要访问表数据）
```sql
EXPLAIN SELECT user_id FROM users WHERE user_id = 1;
```

**Bitmap Heap Scan**: 位图堆扫描（适合多个索引条件）
```sql
EXPLAIN SELECT * FROM products WHERE category = 'electronics' AND price > 100;
```

**Nested Loop**: 嵌套循环连接
```sql
EXPLAIN SELECT * FROM orders o JOIN users u ON o.user_id = u.user_id;
```

**Hash Join**: 哈希连接
```sql
EXPLAIN SELECT * FROM orders o JOIN users u ON o.user_id = u.user_id;
```

**Merge Join**: 合并连接
```sql
EXPLAIN SELECT * FROM orders o JOIN users u ON o.user_id = u.user_id;
```

### 关键信息

**Rows**: 估算的行数
```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 1;
```

**Cost**: 成本估算
- `startup_cost`: 启动成本
- `total_cost`: 总成本

**Actual Time** (EXPLAIN ANALYZE)
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;
```

**Actual Rows** (EXPLAIN ANALYZE)
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;
```

## 查询优化技巧

### 避免 SELECT *

只查询需要的列:

```sql
-- 不好（查询所有列）
SELECT * FROM users WHERE user_id = 1;

-- 好（只查询需要的列）
SELECT username, email FROM users WHERE user_id = 1;
```

### 使用索引列作为查询条件

```sql
-- 不好（无法使用索引）
SELECT * FROM orders WHERE LOWER(status) = 'shipped';

-- 好（可以使用索引）
SELECT * FROM orders WHERE status = 'shipped';
```

### 避免 LIKE 前模糊查询

```sql
-- 不好（无法使用索引）
SELECT * FROM users WHERE username LIKE '%zhang';

-- 好（可以使用索引）
SELECT * FROM users WHERE username LIKE 'zhang%';

-- 或者使用全文索引
SELECT * FROM users WHERE to_tsvector('english', username) @@ to_tsquery('english', 'zhang');
```

### 使用 LIMIT 限制结果集

```sql
-- 不好（可能返回大量数据）
SELECT * FROM orders ORDER BY order_date;

-- 好（只返回需要的行数）
SELECT * FROM orders ORDER BY order_date LIMIT 100;
```

### 使用 EXISTS 替代 IN

```sql
-- IN（子查询可能较慢）
SELECT * FROM users u WHERE u.user_id IN (SELECT user_id FROM orders);

-- EXISTS（通常更快）
SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.user_id);
```

### 避免 OR，使用 UNION ALL

```sql
-- OR（可能导致无法使用索引）
SELECT * FROM products WHERE category = 'electronics' OR category = 'clothing';

-- UNION ALL（可以使用索引）
SELECT * FROM products WHERE category = 'electronics'
UNION ALL
SELECT * FROM products WHERE category = 'clothing';
```

### 使用 JOIN 替代子查询

```sql
-- 子查询（可能较慢）
SELECT * FROM users WHERE user_id IN (SELECT user_id FROM orders WHERE status = 'shipped');

-- JOIN（通常更快）
SELECT DISTINCT u.* FROM users u JOIN orders o ON u.user_id = o.user_id WHERE o.status = 'shipped';
```

### 使用批量插入

```sql
-- 单条插入（慢）
INSERT INTO users (username, email) VALUES ('user1', 'user1@example.com');
INSERT INTO users (username, email) VALUES ('user2', 'user2@example.com');
INSERT INTO users (username, email) VALUES ('user3', 'user3@example.com');

-- 批量插入（快）
INSERT INTO users (username, email) VALUES
    ('user1', 'user1@example.com'),
    ('user2', 'user2@example.com'),
    ('user3', 'user3@example.com');
```

## 优化器提示

### 使用索引提示

```sql
SELECT * FROM orders o JOIN users u ON o.user_id = u.user_id;
```

如果优化器选择了错误的连接方法，可以使用提示（GaussDB 可能不支持所有提示）。

### 强制使用特定索引

```sql
-- 某些数据库支持 INDEX 提示
SELECT * FROM orders WITH (INDEX(idx_orders_user_date)) WHERE user_id = 1;
```

## CTE 优化

### 物化 CTE

```sql
WITH user_stats AS MATERIALIZED (
    SELECT user_id, COUNT(*) AS order_count FROM orders GROUP BY user_id
)
SELECT u.username, us.order_count FROM users u JOIN user_stats us ON u.user_id = us.user_id;
```

### 内联 CTE

```sql
WITH user_stats AS NOT MATERIALIZED (
    SELECT user_id, COUNT(*) AS order_count FROM orders GROUP BY user_id
)
SELECT u.username, us.order_count FROM users u JOIN user_stats us ON u.user_id = us.user_id;
```

## 并行查询优化

### 启用并行查询

```sql
SET max_parallel_workers_per_gather = 4;
```

### 检查并行查询是否被使用

```sql
EXPLAIN SELECT * FROM large_table WHERE condition;
```

查看执行计划中的 `Workers Planned` 字段。

## Tips

**查询优化最佳实践**:
- 使用 EXPLAIN ANALYZE 分析慢查询
- 只查询需要的列
- 使用索引列作为查询条件
- 避免 LIKE 前模糊查询
- 使用 LIMIT 限制结果集
- 使用 EXISTS 替代 IN（合适时）
- 使用 JOIN 替代子查询
- 使用批量操作

**性能考虑**:
- 全表扫描是最慢的扫描方式
- 索引扫描比顺序扫描快
- 只索引扫描最快（不需要访问表数据）
- 避免在 WHERE 中使用函数（会导致索引失效）

**企业规范**:
- [ ] 所有生产 SQL 都经过 EXPLAIN ANALYZE 分析
- [ ] 只查询必要的列
- [ ] 使用索引列作为查询条件
- [ ] 避免 LIKE 前模糊查询
- [ ] 使用 LIMIT 限制结果集
- [ ] 定期审查慢查询日志
- [ ] 比较不同 SQL 写法的性能
- [ ] 建立查询性能基线

## 任务

分析简单查询:

```
[[
EXPLAIN SELECT * FROM users WHERE user_id = 1;
]]{{RUN}}
```

```
[[
EXPLAIN ANALYZE SELECT * FROM users WHERE user_id = 1;
]]{{RUN}}
```

分析表连接:

```
[[
EXPLAIN SELECT u.username, o.order_id FROM users u JOIN orders o ON u.user_id = o.user_id;
]]{{RUN}}
```

```
[[
EXPLAIN ANALYZE SELECT u.username, o.order_id FROM users u JOIN orders o ON u.user_id = o.user_id;
]]{{RUN}}
```

比较不同写法:

```sql
-- 使用 IN
```
[[
EXPLAIN SELECT * FROM users WHERE user_id IN (SELECT user_id FROM orders WHERE status = 'shipped');
]]{{RUN}}
```

```sql
-- 使用 EXISTS
```
[[
EXPLAIN SELECT * FROM users u WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.user_id AND o.status = 'shipped');
]]{{RUN}}
```

比较 LIKE 查询:

```sql
-- 前模糊（无法使用索引）
```
[[
EXPLAIN SELECT * FROM users WHERE username LIKE '%zhang';
]]{{RUN}}
```

```sql
-- 后模糊（可以使用索引）
```
[[
EXPLAIN SELECT * FROM users WHERE username LIKE 'zhang%';
]]{{RUN}}
```

比较 LIMIT 使用:

```sql
-- 无 LIMIT
```
[[
EXPLAIN ANALYZE SELECT * FROM orders ORDER BY order_date;
]]{{RUN}}
```

```sql
-- 有 LIMIT
```
[[
EXPLAIN ANALYZE SELECT * FROM orders ORDER BY order_date LIMIT 100;
]]{{RUN}}
```

分析聚合查询:

```
[[
EXPLAIN ANALYZE SELECT user_id, COUNT(*), SUM(total_amount) FROM orders GROUP BY user_id;
]]{{RUN}}
```

**自动评分**: 验证查询是否使用了索引，是否避免了全表扫描，执行时间是否合理。
