## 学习目标

本章节将帮助您掌握 GaussDB 性能优化的核心技能，从理论到实践全面提升数据库性能。

**学完本章，您将能够：**
- 理解 GaussDB 性能优化的基本原理
- 掌握索引设计的方法和最佳实践
- 熟练使用 EXPLAIN 分析和优化查询
- 理解参数调优的方法和策略
- 掌握性能监控和问题排查技能

## 业务场景

**电商平台性能瓶颈分析**

某电商平台在生产环境遇到严重性能问题：
- 商品查询页面响应时间 > 5秒
- 订单创建在高峰期超时失败
- 数据库 CPU 使用率持续 90%+
- 磁盘 I/O 成为瓶颈

性能分析团队需要：
1. 识别慢查询和性能瓶颈
2. 优化索引设计提高查询速度
3. 调整参数配置提升整体性能
4. 建立性能监控和告警机制

通过本章学习，您将能够：
- 识别和分析性能瓶颈
- 设计高效的索引
- 优化慢查询
- 调整数据库参数
- 建立性能监控体系

## 学习内容

本章节包含以下步骤：
1. **性能基础和指标** - 了解性能指标和监控方法
2. **索引设计和优化** - 掌握索引设计原理和最佳实践
3. **查询优化（EXPLAIN）** - 使用 EXPLAIN 分析和优化查询
4. **参数调优** - 根据场景优化数据库参数

**慢查询诊断案例：电商平台报表系统优化**

某电商平台的业务报表系统在生成销售统计报表时出现严重性能问题，报表生成时间超过 10 分钟，严重影响业务决策和数据分析效率。

**问题现象**:
- 销售统计报表生成时间：10-15 分钟
- 数据库 CPU 使用率持续 100%
- 大量连接等待超时
- 磁盘 I/O 成为瓶颈（读写队列积压）
- 其他业务查询受影响变慢

**慢查询日志分析**:
```sql
-- 查询慢查询日志（配置 slow_query_threshold = 1000ms）
-- postgresql.conf
log_min_duration_statement = 1000  -- 记录超过 1 秒的查询
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

-- 查看慢查询日志
-- tail -f /var/log/gaussdb/gaussdb-1.log | grep "duration:"

-- 发现的最慢查询：
-- 执行时间：542,345 毫秒（约 9 分钟）
SELECT
    p.product_id,
    p.product_name,
    p.category,
    o.order_date,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.unit_price) AS total_amount,
    AVG(oi.quantity * oi.unit_price) AS avg_amount,
    MIN(oi.quantity * oi.unit_price) AS min_amount,
    MAX(oi.quantity * oi.unit_price) AS max_amount
FROM products p
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= '2025-01-01'
  AND o.order_date <= '2025-01-31'
GROUP BY p.product_id, p.product_name, p.category, o.order_date
ORDER BY total_amount DESC;
```

**执行计划分析**:
```sql
-- 使用 EXPLAIN ANALYZE 分析查询执行计划
EXPLAIN ANALYZE
SELECT
    p.product_id,
    p.product_name,
    p.category,
    o.order_date,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.unit_price) AS total_amount,
    AVG(oi.quantity * oi.unit_price) AS avg_amount,
    MIN(oi.quantity * oi.unit_price) AS min_amount,
    MAX(oi.quantity * oi.unit_price) AS max_amount
FROM products p
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= '2025-01-01'
  AND o.order_date <= '2025-01-31'
GROUP BY p.product_id, p.product_name, p.category, o.order_date
ORDER BY total_amount DESC;

-- 执行计划显示：
-- 1. 三个表进行全表扫描（Seq Scan）
-- 2. 嵌套循环连接（Nested Loop），效率低
-- 3. 缺少索引，导致大量 I/O
-- 4. 内存排序（Sort），消耗大量内存
-- 5. Aggregate 操作在连接后执行，处理的数据量巨大

-- 问题点：
-- - products 表：全表扫描，100,000 行
-- - order_items 表：全表扫描，10,000,000 行
-- - orders 表：全表扫描，5,000,000 行
-- - 连接后的中间结果：约 500,000,000 行
-- - 排序和聚合操作：处理 500,000,000 行数据
```

**性能优化方案**:

1. **添加合适的索引**:
```sql
-- 1. 为 orders 表的 order_date 字段创建索引（加速日期范围查询）
CREATE INDEX idx_orders_order_date ON orders(order_date) TABLESPACE fast_ssd;

-- 2. 为 order_items 表的 product_id 字段创建索引（加速连接查询）
CREATE INDEX idx_order_items_product_id ON order_items(product_id) TABLESPACE fast_ssd;

-- 3. 为 order_items 表的 order_id 字段创建索引（加速连接查询）
CREATE INDEX idx_order_items_order_id ON order_items(order_id) TABLESPACE fast_ssd;

-- 4. 为 products 表的 product_id 字段创建主键（如果不存在）
ALTER TABLE products ADD PRIMARY KEY (product_id);

-- 5. 创建复合索引（优化特定查询模式）
CREATE INDEX idx_orders_date_status ON orders(order_date, status) TABLESPACE fast_ssd;
CREATE INDEX idx_order_items_product_order ON order_items(product_id, order_id) TABLESPACE fast_ssd;

-- 6. 创建部分索引（优化常用查询条件）
CREATE INDEX idx_orders_active ON orders(order_date) TABLESPACE fast_ssd
WHERE status = 'COMPLETED';

-- 7. 分析索引使用情况
EXPLAIN ANALYZE
SELECT p.product_id, p.product_name, COUNT(*) AS order_count
FROM products p
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= '2025-01-01' AND o.order_date <= '2025-01-31'
GROUP BY p.product_id, p.product_name;
```

2. **查询语句优化**:
```sql
-- 优化前（使用 DISTINCT 导致额外开销）
SELECT
    p.product_id,
    p.product_name,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.unit_price) AS total_amount
FROM products p
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= '2025-01-01' AND o.order_date <= '2025-01-31'
GROUP BY p.product_id, p.product_name;

-- 优化后（移除不必要的 DISTINCT，调整查询结构）
-- 步骤 1：先按日期范围过滤订单（利用索引）
CREATE TEMPORARY TABLE temp_orders AS
SELECT order_id, order_date
FROM orders
WHERE order_date >= '2025-01-01' AND order_date <= '2025-01-31'
AND status = 'COMPLETED';

-- 步骤 2：连接订单明细（利用索引）
CREATE TEMPORARY TABLE temp_order_items AS
SELECT oi.order_id, oi.product_id, oi.quantity, oi.unit_price
FROM order_items oi
INNER JOIN temp_orders o ON oi.order_id = o.order_id;

-- 步骤 3：聚合产品销售数据
SELECT
    p.product_id,
    p.product_name,
    p.category,
    COUNT(DISTINCT toi.order_id) AS order_count,
    SUM(toi.quantity) AS total_quantity,
    SUM(toi.quantity * toi.unit_price) AS total_amount
FROM products p
INNER JOIN temp_order_items toi ON p.product_id = toi.product_id
GROUP BY p.product_id, p.product_name, p.category
ORDER BY total_amount DESC;

-- 优化后（使用 CTE 重写查询）
WITH filtered_orders AS (
    SELECT order_id, order_date
    FROM orders
    WHERE order_date >= '2025-01-01' AND order_date <= '2025-01-31'
    AND status = 'COMPLETED'
),
order_product_summary AS (
    SELECT
        oi.product_id,
        COUNT(DISTINCT oi.order_id) AS order_count,
        SUM(oi.quantity) AS total_quantity,
        SUM(oi.quantity * oi.unit_price) AS total_amount
    FROM order_items oi
    INNER JOIN filtered_orders fo ON oi.order_id = fo.order_id
    GROUP BY oi.product_id
)
SELECT
    p.product_id,
    p.product_name,
    p.category,
    ops.order_count,
    ops.total_quantity,
    ops.total_amount,
    ops.total_quantity / NULLIF(ops.order_count, 0) AS avg_quantity_per_order
FROM products p
INNER JOIN order_product_summary ops ON p.product_id = ops.product_id
ORDER BY ops.total_amount DESC;
```

3. **数据库参数调优**:
```bash
# postgresql.conf 性能参数优化

# 内存配置
shared_buffers = 8GB  -- 数据库共享缓冲区（建议为系统内存的 25%）
effective_cache_size = 24GB  -- 系统可用缓存（通常为 shared_buffers + 75% 系统内存）
work_mem = 256MB  -- 每个排序/哈希操作的最大内存
maintenance_work_mem = 2GB  -- 维护操作（VACUUM, CREATE INDEX）的内存

# 并发连接配置
max_connections = 500  -- 最大连接数
max_worker_processes = 8  -- 工作进程数（通常为 CPU 核心数）
max_parallel_workers_per_gather = 4  -- 每个并行 Gather 操作的辅助工作进程
max_parallel_workers = 8  -- 最大并行工作进程数

# 查询优化器配置
random_page_cost = 1.1  -- SSD 随机 I/O 成本（HDD 为 4.0，SSD 建议为 1.1）
effective_io_concurrency = 200  -- 并发 I/O 操作数（SSD 建议为 200）
enable_seqscan = off  -- 禁用顺序扫描（仅用于测试，生产环境需谨慎）

# WAL 配置
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# 自动清理配置
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s  -- 每 30 秒检查一次表

# 日志配置
log_min_duration_statement = 1000  -- 记录超过 1 秒的查询
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# 查询执行统计
track_activities = on
track_counts = on
track_io_timing = on  -- 记录 I/O 时间
track_functions = all
log_temp_files = 0  -- 记录所有临时文件

# 预加载库
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all

# 应用配置
ALTER DATABASE ecommerce SET search_path TO public, analytics;
```

4. **统计信息更新和表分区**:
```sql
-- 1. 更新统计信息（使优化器选择最优执行计划）
ANALYZE products;
ANALYZE order_items;
ANALYZE orders;

-- 2. 批量更新所有表的统计信息
ANALYZE VERBOSE;

-- 3. 创建分区表（优化大规模数据查询）
-- 按订单日期范围分区 orders 表
CREATE TABLE orders_partitioned (
    order_id BIGINT,
    customer_id BIGINT,
    order_date DATE,
    status VARCHAR(20),
    total_amount NUMERIC(18,2),
    PRIMARY KEY (order_id, order_date)
) PARTITION BY RANGE (order_date);

-- 创建月度分区
CREATE TABLE orders_202501 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE orders_202502 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE orders_202503 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- 创建默认分区（未来数据）
CREATE TABLE orders_default PARTITION OF orders_partitioned DEFAULT;

-- 迁移数据到分区表
INSERT INTO orders_partitioned SELECT * FROM orders;
-- 验证后删除原表
-- DROP TABLE orders;
-- ALTER TABLE orders_partitioned RENAME TO orders;

-- 4. 创建物化视图（加速固定报表查询）
CREATE MATERIALIZED VIEW sales_summary_mv AS
SELECT
    DATE_TRUNC('month', order_date) AS sales_month,
    product_id,
    COUNT(DISTINCT order_id) AS order_count,
    SUM(quantity) AS total_quantity,
    SUM(quantity * unit_price) AS total_amount
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.status = 'COMPLETED'
GROUP BY DATE_TRUNC('month', o.order_date), product_id
WITH DATA;

-- 创建索引加速物化视图查询
CREATE INDEX idx_sales_summary_month_product ON sales_summary_mv(sales_month, product_id);

-- 定期刷新物化视图
REFRESH MATERIALIZED VIEW sales_summary_mv;
-- 配置自动刷新（使用 cron）
# 0 2 * * * psql -d ecommerce -c "REFRESH MATERIALIZED VIEW sales_summary_mv;"
```

5. **查询性能监控和告警**:
```sql
-- 1. 创建慢查询监控表
CREATE TABLE query_performance_log (
    id BIGSERIAL PRIMARY KEY,
    query_id BIGINT,
    query_text TEXT,
    execution_time_ms BIGINT,
    rows_returned BIGINT,
    rows_scanned BIGINT,
    execution_plan TEXT,
    query_timestamp TIMESTAMP DEFAULT NOW()
);

-- 2. 使用 pg_stat_statements 监控查询性能
-- 查看最慢的查询
SELECT
    queryid,
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    rows,
    100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查看执行次数最多的查询
SELECT
    queryid,
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- 3. 创建性能监控视图
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
    datname,
    queryid,
    SUBSTR(query, 1, 100) AS query_preview,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- 平均执行时间超过 1 秒
ORDER BY mean_exec_time DESC;

-- 4. 配置自动慢查询记录
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mean_exec_time > 5000 THEN  -- 超过 5 秒
        INSERT INTO query_performance_log (query_id, query_text, execution_time_ms, rows_returned, execution_plan)
        VALUES (NEW.queryid, NEW.query, NEW.mean_exec_time, NEW.rows, 'EXPLAIN ANALYZE ' || NEW.query);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 注意：pg_stat_statements 不支持触发器，需要使用外部监控工具
```

**优化效果**:
- 报表生成时间从 10-15 分钟降至 30-45 秒（提升 20 倍）
- 数据库 CPU 使用率从 100% 降至 30-40%
- I/O 等待减少 90%
- 内存使用效率提升 60%
- 并发查询能力提升 5 倍

**最佳实践清单**:
- [ ] 定期更新统计信息（ANALYZE）
- [ ] 为常用查询条件创建合适的索引
- [ ] 使用 EXPLAIN ANALYZE 分析慢查询
- [ ] 优化复杂查询，使用 CTE 和临时表
- [ ] 配置合理的数据库参数（内存、并发）
- [ ] 实施表分区处理大规模数据
- [ ] 使用物化视图加速固定报表
- [ ] 启用 pg_stat_statements 监控查询性能
- [ ] 定期清理和维护数据库（VACUUM, REINDEX）
- [ ] 建立性能基线和告警机制

通过分析此案例，学习如何系统性地诊断和优化慢查询，从索引设计、查询重写、参数调优等多个维度提升数据库性能，满足高并发业务需求。

<font color=darkred>*注意: 本章节需要您已经完成"GaussDB 架构与原理"、"安装与配置"和"SQL 开发基础"章节的学习*</font>

## 前置要求

- 完成"GaussDB 架构与原理"章节
- 完成"安装与配置"章节
- 完成"SQL 开发基础"章节
- 理解查询执行计划和优化原理
