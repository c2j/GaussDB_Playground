# 性能基础和指标

## 性能指标

### 响应时间
- **定义**: 从请求发出到收到响应的时间
- **目标**: < 100ms (实时), < 1s (交互式), < 10s (批处理)

### 吞吐量
- **定义**: 单位时间内处理的请求数量
- **指标**: QPS (Queries Per Second), TPS (Transactions Per Second)
- **目标**: 根据业务需求确定

### 并发性
- **定义**: 同时处理的请求数量
- **指标**: 活动连接数, 并行查询数
- **目标**: 利用多核 CPU 提升并发能力

### 资源利用率
- **CPU**: 数据库 CPU 使用率
- **内存**: shared_buffers 命中率, 工作内存使用
- **I/O**: 磁盘读写次数, I/O 等待时间
- **网络**: 网络带宽使用, 延迟

## 系统视图

### pg_stat_database
查看数据库级别的统计信息：

```sql
SELECT
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    round(blks_hit::numeric / NULLIF(blks_hit + blks_read, 0) * 100, 2) AS cache_hit_ratio,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database
WHERE datname = current_database();
```

### pg_stat_user_tables
查看表级别的统计信息：

```sql
SELECT
    schemaname,
    tablename,
    seq_scan,  -- 顺序扫描次数
    seq_tup_read,  -- 顺序扫描读取的行数
    idx_scan,  -- 索引扫描次数
    idx_tup_fetch,  -- 索引扫描获取的行数
    n_tup_ins,  -- 插入的行数
    n_tup_upd,  -- 更新的行数
    n_tup_del  -- 删除的行数
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

**重点关注**:
- `seq_scan` 过高: 可能需要添加索引
- `idx_scan` 过低: 索引未被使用

### pg_stat_user_indexes
查看索引使用情况：

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,  -- 索引扫描次数
    idx_tup_read,  -- 通过索引读取的行数
    idx_tup_fetch  -- 通过索引获取的行数
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**重点关注**:
- `idx_scan = 0`: 索引未被使用
- `idx_scan` 过低: 考虑是否需要索引

### pg_stat_activity
查看当前活动会话：

```sql
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    waiting,
    query
FROM pg_stat_activity
WHERE state != 'idle';
```

## 慢查询

### pg_stat_statements
查看 SQL 性能统计：

```sql
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**关键指标**:
- `mean_time`: 平均执行时间
- `calls`: 调用次数
- `rows`: 返回的行数

### 启用慢查询日志

在 `postgresql.conf` 中配置：

```
log_min_duration_statement = 1000  -- 记录执行时间 > 1000ms 的查询
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

## 缓存性能

### 缓存命中率计算

```sql
SELECT
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) * 100 AS cache_hit_ratio
FROM pg_stat_database;
```

**目标**: > 90%

### 查看缓存统计

```sql
SELECT
    pg_size_pretty(pg_relation_size('table_name')) AS table_size,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE tablename = 'table_name';
```

## 并发和锁

### pg_locks
查看当前锁信息：

```sql
SELECT
    locktype,
    database,
    relation,
    page,
    tuple,
    virtualxid,
    transactionid,
    classid,
    objid,
    objsubid,
    pid,
    mode,
    granted,
    fastpath
FROM pg_locks
WHERE NOT granted;
```

### pg_blocking_pids
查看阻塞的进程：

```sql
SELECT * FROM pg_blocking_pids();
```

## I/O 性能

### pg_stat_bgwriter
查看后台写入进程统计：

```sql
SELECT * FROM pg_stat_bgwriter;
```

### pg_stat_database_conflicts
查看数据库冲突统计：

```sql
SELECT * FROM pg_stat_database_conflicts;
```

## Tips

**性能监控最佳实践**：
- 定期检查慢查询日志
- 监控缓存命中率
- 观察锁等待情况
- 跟踪 CPU、内存、I/O 使用
- 设置性能基线和告警阈值

**问题排查流程**：
1. 识别慢查询
2. 分析执行计划 (EXPLAIN ANALYZE)
3. 检查索引使用情况
4. 优化查询或添加索引
5. 监控优化效果

**企业规范**：
- [ ] 建立性能基线
- [ ] 监控关键性能指标
- [ ] 设置告警阈值
- [ ] 定期审查慢查询
- [ ] 记录性能优化过程
- [ ] 建立性能报告

## 任务

查看数据库统计：

`[[SELECT * FROM pg_stat_database WHERE datname = current_database();]]{{RUN}}`

查看表统计：

`[[SELECT * FROM pg_stat_user_tables ORDER BY seq_scan DESC LIMIT 5;]]{{RUN}}`

查看索引使用：

`[[SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan ASC LIMIT 10;]]{{RUN}}`

查看慢查询：

`[[SELECT query, calls, mean_time, rows FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;]]{{RUN}}`

查看活动会话：

`[[SELECT pid, state, waiting, LEFT(query, 50) FROM pg_stat_activity WHERE state != 'idle';]]{{RUN}}`

计算缓存命中率：

```sql
[[
SELECT
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) * 100 AS cache_hit_ratio
FROM pg_stat_database;
]]{{RUN}}
```

查看锁信息：

`[[SELECT * FROM pg_locks WHERE NOT granted;]]{{RUN}}`

**自动评分**：检查缓存命中率是否 > 90%，是否有未使用的索引，是否有明显的慢查询。
