# 索引设计和优化

## 索引基础

### 索引的作用
- **加速查询**: 避免全表扫描
- **强制唯一性**: UNIQUE 约束
- **外键支持**: 自动创建外键索引
- **排序优化**: 使用索引快速排序

### 索引类型

**B-树索引 (默认)**
- 适合等值查询和范围查询
- 支持排序
- 适合大多数场景

**Hash 索引**
- 只支持等值查询
- 不支持排序
- 内存查询快，磁盘查询慢

**GiST 索引**
- 支持复杂查询（空间数据、全文搜索）
- 操作符: `&&, ||, ->>, <@`

**GIN 索引**
- 适合数组、JSON、全文搜索
- 操作符: `@>, <@, ?`

**SP-GiST 索引**
- 空间数据专用索引
- 支持地理空间查询

## 创建索引

### 基本语法

```sql
CREATE INDEX index_name ON table_name (column_name);
```

### 唯一索引

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### 复合索引

```sql
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);
```

### 表达式索引

```sql
CREATE INDEX idx_products_price ON products((price * quantity));
```

### 部分索引

```sql
CREATE INDEX idx_orders_date_part ON orders(order_date);
CREATE INDEX idx_orders_date_2024 ON orders(order_date)
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';
```

### 函数索引

```sql
CREATE INDEX idx_users_lower_name ON users(LOWER(username));
```

## 索引设计原则

### 选择性

选择性 = 不同值数 / 总行数

```sql
-- 计算选择性
SELECT
    column_name,
    n_distinct,
    n_tup_ins + n_tup_upd + n_tup_del AS total_rows,
    round(n_distinct::numeric / (n_tup_ins + n_tup_upd + n_tup_del) * 100, 2) AS selectivity_percent
FROM pg_stats
WHERE schemaname = 'public';
```

**选择性建议**:
- < 1%: 索引效果很好
- 1-10%: 索引效果好
- 10-30%: 索引效果一般
- > 30%: 不建议索引

### 复合索引顺序

**WHERE 子句中频繁使用的列放前面**

```sql
-- 好的设计
CREATE INDEX idx_orders_user_status_date ON orders(user_id, status, order_date);

-- 查询可以使用索引
SELECT * FROM orders WHERE user_id = 1 AND status = 'shipped';
SELECT * FROM orders WHERE user_id = 1 AND status = 'shipped' AND order_date > '2024-01-01';

-- 这个查询无法使用索引（缺少 user_id）
SELECT * FROM orders WHERE status = 'shipped';
```

### 覆盖索引

**索引包含查询的所有列，不需要访问表**

```sql
CREATE INDEX idx_orders_cover ON orders(user_id, status, order_date, total_amount);

-- 覆盖查询（不需要访问表）
SELECT status, order_date, total_amount FROM orders WHERE user_id = 1;
```

### 避免过度索引

**索引的代价**:
- 插入/更新/删除需要维护索引
- 占用存储空间
- 优化器可能选择错误的索引

**建议**:
- 单表索引数 < 5-10 个
- 经常更新的表避免过多索引
- 删除未使用的索引

## 索引维护

### 分析表统计信息

```sql
ANALYZE table_name;
```

或使用 gs_check 工具:

```
[[
/opt/gaussdb/tool/script/gs_check -U omm -W Gauss@1234 --analyze
]]{{RUN}}
```

### 重建索引

```sql
REINDEX INDEX index_name;
```

或重建表的所有索引:

```sql
REINDEX TABLE table_name;
```

### 查看索引使用情况

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC
LIMIT 20;
```

重点关注:
- `idx_scan = 0`: 未使用的索引
- `idx_scan` 过低: 考虑删除

## 索引优化技巧

### 部分索引

适合场景:
- 大表中的热数据（最近的数据）
- 不同值的分布不均匀
- 可以显著减少索引大小

示例:

```sql
CREATE INDEX idx_orders_recent ON orders(order_date)
WHERE order_date >= CURRENT_DATE - INTERVAL '1 year';
```

### 表达式索引

适合场景:
- 经常按计算字段查询
- 复杂的 WHERE 条件

示例:

```sql
CREATE INDEX idx_orders_total ON orders((price * quantity));

SELECT * FROM orders WHERE price * quantity > 1000;
```

### 只索引

索引包含所有查询列，避免访问表数据:

```sql
CREATE INDEX idx_orders_only_index ON orders(user_id, order_date, status);
```

查询:

```sql
SELECT order_date, status FROM orders WHERE user_id = 1;
```

### 延迟索引 (Partial Index with Function)

结合部分索引和函数索引:

```sql
CREATE INDEX idx_users_active ON users(user_id, last_login)
WHERE status = 'active' AND last_login > CURRENT_DATE - INTERVAL '90 days';
```

## 删除索引

```sql
DROP INDEX index_name;
```

或使用 CONCURRENTLY 避免锁表:

```sql
DROP INDEX CONCURRENTLY index_name;
```

## Tips

**索引设计最佳实践**:
- 为 WHERE、JOIN、ORDER BY、GROUP BY 列创建索引
- 选择性高的列优先索引
- 复合索引注意列的顺序
- 避免过度索引
- 定期分析表统计信息
- 删除未使用的索引

**性能考虑**:
- 索引提高查询性能但降低写性能
- 复合索引的顺序很重要
- 表达式索引可能无法使用某些优化
- 部分索引可以减少索引大小

**企业规范**:
- [ ] 为查询条件列创建索引
- [ ] 为外键列创建索引
- [ ] 定期分析表统计信息
- [ ] 监控索引使用情况
- [ ] 删除未使用的索引
- [ ] 避免过度索引
- [ ] 使用 CONCURRENTLY 创建/删除索引（生产环境）
- [ ] 定期重建碎片化的索引

## 任务

查看表的统计信息:

```
[[
SELECT
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del AS total_rows,
    seq_scan,
    idx_scan,
    round(seq_scan::numeric / NULLIF(seq_scan + idx_scan, 0) * 100, 2) AS seq_scan_percent
FROM pg_stat_user_tables
WHERE tablename IN ('users', 'products', 'orders')
ORDER BY tablename;
]]{{RUN}}
```

为常用查询条件创建索引:

```
[[
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);
CREATE INDEX idx_orders_status ON orders(status);
]]{{RUN}}
```

创建部分索引（只索引活跃订单）:

```
[[
CREATE INDEX idx_orders_active ON orders(user_id, order_date, status)
WHERE status IN ('pending', 'shipped', 'processing');
]]{{RUN}}
```

创建覆盖索引:

```
[[
CREATE INDEX idx_orders_cover ON orders(user_id, order_date, status, total_amount);
]]{{RUN}}
```

查看索引使用情况:

```
[[
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
]]{{RUN}}
```

分析表统计信息:

```
[[
ANALYZE users;
ANALYZE products;
ANALYZE orders;
]]{{RUN}}
```

验证索引效果:

```
[[
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 1 AND order_date > '2024-01-01';
]]{{RUN}}
```

```
[[
EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'electronics' AND price > 100;
]]{{RUN}}
```

**自动评分**: 验证索引是否被正确使用，查询是否使用了 Index Scan 而非 Seq Scan。

## 错误演示

创建低选择性索引:

```sql
CREATE INDEX idx_orders_status ON orders(status);
```

说明: 如果 status 只有少数几个值（pending, shipped, completed），选择性很低，索引效果不好。

查询无法使用索引:

```
[[
-- 索引是 (user_id, order_date)
-- 这个查询无法使用索引（缺少 user_id）
EXPLAIN SELECT * FROM orders WHERE order_date > '2024-01-01';
]]{{RUN}}
```

说明: 复合索引必须满足最左前缀原则，否则无法使用索引。

过度索引:

```sql
-- 为不常查询的列创建索引
CREATE INDEX idx_users_create_time ON users(create_time);
```

说明: 不常查询的列创建索引只会降低写性能，没有查询收益。
