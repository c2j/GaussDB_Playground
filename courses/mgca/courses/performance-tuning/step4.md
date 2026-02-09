# 参数调优

## 参数分类

### 内存参数
- `shared_buffers`: 共享缓冲区
- `work_mem`: 工作内存
- `maintenance_work_mem`: 维护工作内存
- `effective_cache_size`: 有效缓存大小

### 查询优化参数
- `enable_seqscan`: 是否允许顺序扫描
- `random_page_cost`: 随机 I/O 成本
- `effective_io_concurrency`: 并发 I/O 请求数
- `geqo_threshold`: 遗传优化器阈值

### 连接参数
- `max_connections`: 最大连接数
- `superuser_reserved_connections`: 超级用户保留连接数

### WAL 参数
- `wal_buffers`: WAL 缓冲区
- `wal_sync_method`: WAL 同步方法
- `checkpoint_timeout`: 检查点超时
- `checkpoint_completion_target`: 检查点完成目标

### 并行查询参数
- `max_parallel_workers`: 最大并行工作进程
- `max_parallel_workers_per_gather`: 每个 Gather 节点的并行工作进程数

### 自动清理参数
- `autovacuum`: 是否启用自动清理
- `autovacuum_max_workers`: 自动清理最大工作进程数
- `autovacuum_naptime`: 自动清理间隔

## 内存参数调优

### shared_buffers

**作用**: 数据页缓存大小
**默认值**: 32MB
**推荐值**: 系统内存的 25%-40%

```sql
-- 查看当前值
SHOW shared_buffers;

-- 修改配置（需要重启）
-- 在 postgresql.conf 中设置
-- shared_buffers = 4GB
```

**注意事项**:
- 不要设置过大，需要为操作系统留出足够内存
- 增加后需要重启数据库
- 监控缓存命中率（目标 > 90%）

### work_mem

**作用**: 排序、哈希等操作的工作内存
**默认值**: 4MB
**推荐值**: 16MB-128MB（根据并发数调整）

```sql
-- 查看当前值
SHOW work_mem;

-- 动态修改（会话级别）
SET work_mem = '64MB';

-- 修改配置
-- 在 postgresql.conf 中设置
-- work_mem = 64MB
```

**注意事项**:
- 值过大可能导致内存不足
- 每个连接可能使用 work_mem * max_parallel_workers
- 排序操作需要足够的工作内存

### effective_cache_size

**作用**: GaussDB 认为操作系统可用的缓存大小
**默认值**: 128MB
**推荐值**: 系统内存的 50%-75%

```sql
-- 查看当前值
SHOW effective_cache_size;

-- 修改配置
-- 在 postgresql.conf 中设置
-- effective_cache_size = 12GB
```

**注意事项**:
- 影响优化器的决策
- 不影响实际内存分配
- 应该小于系统可用内存

### maintenance_work_mem

**作用**: 维护操作（VACUUM、CREATE INDEX）的工作内存
**默认值**: 64MB
**推荐值**: 256MB-1GB

```sql
-- 查看当前值
SHOW maintenance_work_mem;

-- 动态修改
SET maintenance_work_mem = '512MB';
```

**注意事项**:
- VACUUM 和 CREATE INDEX 会使用
- 较大的值可以加速这些操作
- 但会增加内存压力

## I/O 参数调优

### random_page_cost

**作用**: 随机 I/O 成本（相对于顺序 I/O）
**默认值**: 4.0
**推荐值**: SSD: 1.1-2.0, HDD: 2.0-4.0

```sql
-- 查看当前值
SHOW random_page_cost;

-- 动态修改
SET random_page_cost = 1.5;
```

**注意事项**:
- SSD 设置较低的值
- 影响 Index Scan 和 Seq Scan 的成本比较
- 值过低可能导致过度使用索引

### effective_io_concurrency

**作用**: 系统可以同时处理的 I/O 请求数
**默认值**: 1
**推荐值**: SSD: 100-200, HDD: 2

```sql
-- 查看当前值
SHOW effective_io_concurrency;

-- 修改配置
-- 在 postgresql.conf 中设置
-- effective_io_concurrency = 200
```

**注意事项**:
- RAID 控制器可以设置更高值
- 影响并行度
- 设置不当可能降低性能

## 查询优化参数调优

### enable_seqscan

**作用**: 是否允许顺序扫描
**默认值**: on
**推荐值**: on（特殊情况下临时关闭）

```sql
-- 查看当前值
SHOW enable_seqscan;

-- 临时关闭（用于调试）
SET enable_seqscan = off;
```

**注意事项**:
- 通常不需要修改
- 关闭后可能导致查询失败或性能更差

### geqo_threshold

**作用**: 启用遗传优化器的查询规模阈值
**默认值**: 12（表连接数）
**推荐值**: 12-20

```sql
-- 查看当前值
SHOW geqo_threshold;

-- 修改配置
-- 在 postgresql.conf 中设置
-- geqo_threshold = 15
```

**注意事项**:
- 复杂查询使用遗传优化器
- 增加阈值可能会找到更好的计划
- 但也会增加优化时间

## WAL 参数调优

### wal_buffers

**作用**: WAL 缓冲区大小
**默认值**: 8MB
**推荐值**: 16MB-64MB

```sql
-- 查看当前值
SHOW wal_buffers;

-- 修改配置
-- 在 postgresql.conf 中设置
-- wal_buffers = 32MB
```

**注意事项**:
- 增加可以提高写性能
- 但会增加内存使用
- 崩溃恢复时间会增加

### checkpoint_timeout

**作用**: 自动检查点间隔
**默认值**: 15分钟
**推荐值**: 5-10分钟

```sql
-- 查看当前值
SHOW checkpoint_timeout;

-- 修改配置
-- 在 postgresql.conf 中设置
-- checkpoint_timeout = 5min
```

**注意事项**:
- 更频繁的检查点减少恢复时间
- 但会增加 I/O 压力
- 需要根据 RPO/RTO 要求调整

### checkpoint_completion_target

**作用**: 检查点完成目标（占总时间的比例）
**默认值**: 0.5 (50%)
**推荐值**: 0.7-0.9

```sql
-- 查看当前值
SHOW checkpoint_completion_target;

-- 修改配置
-- 在 postgresql.conf 中设置
-- checkpoint_completion_target = 0.8
```

**注意事项**:
- 值越高检查点越平滑
- 但 I/O 峰值会更大
- 需要根据 I/O 性能调整

## 并行查询参数调优

### max_parallel_workers_per_gather

**作用**: 每个 Gather 节点的并行工作进程数
**默认值**: 2
**推荐值**: 4-8（根据 CPU 核心数）

```sql
-- 查看当前值
SHOW max_parallel_workers_per_gather;

-- 修改配置
-- 在 postgresql.conf 中设置
-- max_parallel_workers_per_gather = 4
```

**注意事项**:
- 每个 CPU 核心可以运行一个工作进程
- 不是所有查询都会使用并行
- 复杂查询（大表扫描、聚合）才可能使用

### max_parallel_workers

**作用**: 系统级最大并行工作进程数
**默认值**: 8
**推荐值**: CPU 核心数

```sql
-- 查看当前值
SHOW max_parallel_workers;

-- 修改配置
-- 在 postgresql.conf 中设置
-- max_parallel_workers = 8
```

**注意事项**:
- 所有查询的并行工作进程总数
- 不应该超过 CPU 核心数

## 连接参数调优

### max_connections

**作用**: 最大并发连接数
**默认值**: 200
**推荐值**: 根据应用需求设置

```sql
-- 查看当前值
SHOW max_connections;

-- 修改配置（需要重启）
-- 在 postgresql.conf 中设置
-- max_connections = 500
```

**注意事项**:
- 每个连接消耗内存
- 连接数过多会影响性能
- 建议使用连接池

## 自动清理参数调优

### autovacuum

**作用**: 是否启用自动清理
**默认值**: on
**推荐值**: on

```sql
-- 查看当前值
SHOW autovacuum;
```

**注意事项**:
- 必须启用以防止表膨胀
- 禁用会导致性能下降

### autovacuum_max_workers

**作用**: 自动清理最大工作进程数
**默认值**: 3
**推荐值**: CPU 核心数 / 4

```sql
-- 查看当前值
SHOW autovacuum_max_workers;

-- 修改配置
-- 在 postgresql.conf 中设置
-- autovacuum_max_workers = 4
```

**注意事项**:
- 增加可以加快清理速度
- 但会增加 I/O 和 CPU 压力

### autovacuum_naptime

**作用**: 自动清理间隔时间
**默认值**: 1分钟
**推荐值**: 5-15分钟

```sql
-- 查看当前值
SHOW autovacuum_naptime;

-- 修改配置
-- 在 postgresql.conf 中设置
-- autovacuum_naptime = 10min
```

**注意事项**:
- 写操作频繁的表可以缩短间隔
- 避免设置过短导致频繁清理

## 参数调优实践

### OLTP 场景配置

适合高并发 OLTP 应用:

```sql
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
# OLTP 场景优化
max_connections = 1000
shared_buffers = 8GB
work_mem = 64MB
effective_cache_size = 24GB
random_page_cost = 1.5
effective_io_concurrency = 200
max_parallel_workers_per_gather = 4
wal_buffers = 64MB
checkpoint_timeout = 5min
checkpoint_completion_target = 0.8
autovacuum_max_workers = 4
EOF
```

### OLAP 场景配置

适合分析查询 OLAP 应用:

```sql
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
# OLAP 场景优化
max_connections = 200
shared_buffers = 16GB
work_mem = 256MB
maintenance_work_mem = 512MB
effective_cache_size = 40GB
random_page_cost = 2.0
effective_io_concurrency = 2
max_parallel_workers_per_gather = 8
geqo_threshold = 15
wal_buffers = 32MB
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
EOF
```

### 混合场景配置

适合混合 OLTP/OLAP 应用:

```sql
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
# 混合场景优化
max_connections = 500
shared_buffers = 12GB
work_mem = 128MB
maintenance_work_mem = 256MB
effective_cache_size = 32GB
random_page_cost = 1.8
effective_io_concurrency = 100
max_parallel_workers_per_gather = 6
wal_buffers = 48MB
checkpoint_timeout = 10min
checkpoint_completion_target = 0.85
autovacuum_max_workers = 4
autovacuum_naptime = 10min
EOF
```

## Tips

**参数调优最佳实践**:
- 一次修改一个参数
- 监控修改后的效果
- 记录所有参数修改
- 在测试环境验证
- 定期审查参数配置

**性能考虑**:
- 内存参数需要根据系统内存分配
- I/O 参数需要根据存储类型调整
- 并行参数需要根据 CPU 核心数调整
- 连接数需要根据应用需求调整

**企业规范**:
- [ ] 根据业务场景选择参数配置
- [ ] 监控参数修改后的性能变化
- [ ] 记录所有参数修改
- [ ] 在测试环境验证配置
- [ ] 配置性能监控和告警
- [ ] 建立参数变更审批流程
- [ ] 定期审查参数配置
- [ ] 备份配置文件

## 任务

查看关键参数:

```sql
SELECT
    name,
    setting,
    unit,
    context,
    vartype,
    source,
    min_val,
    max_val
FROM pg_settings
WHERE name IN ('shared_buffers', 'work_mem', 'effective_cache_size',
             'random_page_cost', 'max_connections', 'autovacuum_naptime')
ORDER BY name;
```

动态修改参数:

```sql
SET work_mem = '128MB';
SET random_page_cost = 1.8;
SET max_parallel_workers_per_gather = 6;
```

验证修改:

```sql
SHOW work_mem;
SHOW random_page_cost;
SHOW max_parallel_workers_per_gather;
```

配置 OLTP 场景参数:

```sql
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
# 性能优化配置（OLTP 场景）
shared_buffers = 4GB
work_mem = 64MB
effective_cache_size = 12GB
random_page_cost = 1.5
effective_io_concurrency = 200
max_parallel_workers_per_gather = 4
wal_buffers = 32MB
checkpoint_timeout = 5min
checkpoint_completion_target = 0.8
autovacuum_max_workers = 4
autovacuum_naptime = 5min
EOF
```

重启数据库:

```sql
gs_ctl restart
```

验证配置:

```sql
SHOW shared_buffers;
SHOW work_mem;
SHOW wal_buffers;
```

**自动评分**: 验证参数配置是否合理，是否根据场景进行了优化。
