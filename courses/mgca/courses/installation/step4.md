# 参数调优

## 性能优化参数

### 连接相关参数

**max_connections**
- **作用**: 最大并发连接数
- **默认值**: 200
- **推荐值**: 根据应用并发需求设置
- **生产建议**: 500-1000（根据实际情况调整）

查看当前值：

`[[SHOW max_connections;]]{{RUN}}`

**idle_in_transaction_session_timeout**
- **作用**: 空闲事务超时时间
- **默认值**: 1天
- **推荐值**: 10-30分钟
- **说明**: 防止长事务导致锁资源

查看当前值：

`[[SHOW idle_in_transaction_session_timeout;]]{{RUN}}`

### 内存相关参数

**shared_buffers**
- **作用**: 共享缓冲区大小
- **默认值**: 32MB
- **推荐值**: 系统内存的 25%-40%
- **影响**: 数据页缓存大小

查看当前值：

`[[SHOW shared_buffers;]]{{RUN}}`

**work_mem**
- **作用**: 单个操作的工作内存
- **默认值**: 4MB
- **推荐值**: 16MB-64MB
- **说明**: 排序、哈希操作使用，每个连接可能使用 work_mem * max_parallel_workers

查看当前值：

`[[SHOW work_mem;]]{{RUN}}**

**maintenance_work_mem**
- **作用**: 维护操作的工作内存
- **默认值**: 64MB
- **推荐值**: 256MB-512MB
- **说明**: VACUUM、CREATE INDEX 使用

查看当前值：

`[[SHOW maintenance_work_mem;]]{{RUN}}**

**effective_cache_size**
- **作用**: GaussDB 认为操作系统可用的缓存大小
- **默认值**: 128MB
- **推荐值**: 系统内存的 50%-75%
- **说明**: 帮助优化器做出更好的决策

查看当前值：

`[[SHOW effective_cache_size;]]{{RUN}}`

### I/O 相关参数

**random_page_cost**
- **作用**: 随机 I/O 成本
- **默认值**: 4.0
- **推荐值**: SSD: 1.1-2.0, HDD: 2.0-4.0
- **说明**: 影响索引扫描与顺序扫描的成本比

查看当前值：

`[[SHOW random_page_cost;]]{{RUN}}`

设置为 SSD：

`[[SET random_page_cost = 1.5;]]{{RUN}}`

**effective_io_concurrency**
- **作用**: 并发 I/O 请求数
- **默认值**: 1（SSD 可提高）
- **推荐值**: SSD: 100-200, HDD: 2
- **说明**: 多块设备时可设置更大值

查看当前值：

`[[SHOW effective_io_concurrency;]]{{RUN}}`

设置为 SSD：

`[[SET effective_io_concurrency = 200;]]{{RUN}}`

## 查询优化参数

**enable_nestloop**
- **作用**: 启用嵌套循环连接
- **默认值**: on
- **场景**: 小表连接大表时可能更快

查看当前值：

`[[SHOW enable_nestloop;]]{{RUN}}`

**enable_hashjoin**
- **作用**: 启用哈希连接
- **默认值**: on
- **场景**: 大表等值连接时最快

查看当前值：

`[[SHOW enable_hashjoin;]]{{RUN}}`

**enable_mergejoin**
- **作用**: 启用合并连接
- **默认值**: on
- **场景**: 预排序数据的连接最快

查看当前值：

`[[SHOW enable_mergejoin;]]{{RUN}}`

**geqo_threshold**
- **作用**: 启用遗传查询优化器的查询规模阈值
- **默认值**: 12（表连接数）
- **推荐值**: 12-20
- **说明**: 复杂查询使用遗传优化器可能找到更好的计划

查看当前值：

`[[SHOW geqo_threshold;]]{{RUN}}`

## 并行查询参数

**max_parallel_workers_per_gather**
- **作用**: 每个节点的最大并行工作进程数
- **默认值**: 2
- **推荐值**: 4-8（根据 CPU 核心数）
- **说明**: 并行查询的并行度

查看当前值：

`[[SHOW max_parallel_workers_per_gather;]]{{RUN}}`

**max_parallel_workers**
- **作用**: 系统级最大并行工作进程数
- **默认值**: 8
- **推荐值**: CPU 核心数
- **说明**: 所有查询的并行工作进程总数

查看当前值：

`[[SHOW max_parallel_workers;]]{{RUN}}`

**parallel_setup_cost**
- **作用**: 并行启动成本
- **默认值**: 1000.0
- **说明**: 值越高越不容易使用并行

查看当前值：

`[[SHOW parallel_setup_cost;]]{{RUN}}`

**parallel_tuple_cost**
- **作用**: 并行处理每个元组的成本
- **默认值**: 0.1
- **说明**: 值越高越不容易使用并行

查看当前值：

`[[SHOW parallel_tuple_cost;]]{{RUN}}`

## WAL 优化参数

**wal_buffers**
- **作用**: WAL 缓冲区大小
- **默认值**: 8MB
- **推荐值**: 16MB-64MB
- **说明**: 增加 WAL 缓冲区可提高写性能

查看当前值：

`[[SHOW wal_buffers;]]{{RUN}}`

**checkpoint_timeout**
- **作用**: 自动检查点间隔
- **默认值**: 15分钟
- **推荐值**: 5-10分钟
- **说明**: 更频繁的检查点减少崩溃恢复时间

查看当前值：

`[[SHOW checkpoint_timeout;]]{{RUN}}`

**checkpoint_completion_target**
- **作用**: 检查点完成目标
- **默认值**: 0.5 (50%)
- **推荐值**: 0.5-0.9
- **说明**: 值越高检查点越平滑，但 I/O 峰值越大

查看当前值：

`[[SHOW checkpoint_completion_target;]]{{RUN}}`

**max_wal_size**
- **作用**: WAL 日志最大大小
- **默认值**: 1GB
- **推荐值**: 2-8GB
- **说明**: 增加 WAL 大小可支持更长时间的事务

查看当前值：

`[[SHOW max_wal_size;]]{{RUN}}`

## 自动清理参数

**autovacuum**
- **作用**: 是否启用自动清理
- **默认值**: on
- **推荐值**: on
- **说明**: 必须启用以防止表膨胀

查看当前值：

`[[SHOW autovacuum;]]{{RUN}}`

**autovacuum_max_workers**
- **作用**: 自动清理最大工作进程数
- **默认值**: 3
- **推荐值**: CPU 核心数 / 4
- **说明**: 增加可加快清理速度

查看当前值：

`[[SHOW autovacuum_max_workers;]]{{RUN}}`

**autovacuum_naptime**
- **作用**: 自动清理间隔时间
- **默认值**: 1分钟
- **推荐值**: 5-15分钟
- **说明**: 写操作频繁的表可缩短间隔

查看当前值：

`[[SHOW autovacuum_naptime;]]{{RUN}}`

## 参数调优实践

### 场景 1: 高并发 OLTP

针对高并发 OLTP 场景的推荐配置：

```
[[
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
# OLTP 场景优化
max_connections = 1000
shared_buffers = 8GB
work_mem = 32MB
effective_cache_size = 24GB
random_page_cost = 1.5
effective_io_concurrency = 200
max_parallel_workers_per_gather = 4
wal_buffers = 64MB
checkpoint_timeout = 5min
checkpoint_completion_target = 0.7
EOF
]]{{RUN}}
```

### 场景 2: OLAP 分析查询

针对 OLAP 场景的推荐配置：

```
[[
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
# OLAP 场景优化
max_connections = 200
shared_buffers = 16GB
work_mem = 128MB
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
]]{{RUN}}
```

### 场景 3: 混合工作负载

针对混合 OLTP/OLAP 场景的平衡配置：

```
[[
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
# 混合工作负载优化
max_connections = 500
shared_buffers = 12GB
work_mem = 64MB
maintenance_work_mem = 256MB
effective_cache_size = 32GB
random_page_cost = 1.8
effective_io_concurrency = 100
max_parallel_workers_per_gather = 6
wal_buffers = 48MB
checkpoint_timeout = 10min
checkpoint_completion_target = 0.8
EOF
]]{{RUN}}
```

## 监控和调优

### 查看性能统计

查看缓存命中率：

```
[[
SELECT
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) AS cache_hit_ratio
FROM pg_stat_database;
]]{{RUN}}
```

目标缓存命中率：> 90%

### 查看活跃连接

`[[SELECT count(*) FROM pg_stat_activity;]]{{RUN}}`

### 查看慢查询

```
[[
SELECT
    query,
    calls,
    total_time / calls AS avg_time,
    total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
]]{{RUN}}
```

### 查看锁等待

```
[[
SELECT
    pid,
    usename,
    state,
    query,
    wait_event_type
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY wait_event_type;
]]{{RUN}}
```

## 理论验证

参数调优需要根据业务场景、硬件资源和性能目标进行综合评估。不同的应用场景需要不同的配置策略。

## Tips

**调优原则**：
- **一次一个参数**: 避免同时修改多个参数
- **监控效果**: 观察参数修改后的性能变化
- **渐进式调整**: 从保守值开始，逐步优化
- **记录变更**: 记录所有参数修改和原因
- **测试验证**: 在测试环境验证配置效果

**调优工具**：
- **EXPLAIN ANALYZE**: 分析查询执行计划
- **pg_stat_statements**: 查看 SQL 性能统计
- **pg_stat_activity**: 监控活动会话
- **系统监控**: CPU、内存、I/O、网络监控

**常见误区**：
- **盲目增加内存**: shared_buffers 设置过大会导致 OS 缓存不足
- **忽视 I/O 成本**: random_page_cost 不适配硬件类型
- **连接数过大**: max_connections 过高会消耗大量内存
- **检查点过频**: checkpoint_timeout 过短会导致 I/O 峰值

**企业规范 Checklist**：
- [ ] 根据业务场景选择合适的参数配置
- [ ] 监控参数修改后的性能变化
- [ ] 记录所有参数修改
- [ ] 定期审查参数配置的合理性
- [ ] 在测试环境验证配置
- [ ] 配置性能监控和告警
- [ ] 建立基线性能指标
- [ ] 制定回滚计划

## 任务

查看当前参数配置：

`[[SHOW ALL;]]{{PRINT}}`

查看特定参数：

`[[SHOW shared_buffers;]]{{RUN}}`

`[[SHOW work_mem;]]{{RUN}}`

`[[SHOW max_connections;]]{{RUN}}`

`[[SHOW random_page_cost;]]{{RUN}}`

查看缓存命中率：

```
[[
SELECT
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) AS cache_hit_ratio
FROM pg_stat_database;
]]{{RUN}}
```

临时修改参数（会话级别）：

`[[SET work_mem = '128MB';]]{{RUN}}`

`[[SHOW work_mem;]]{{RUN}}`

修改配置文件（永久生效）：

```
[[
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
# 性能优化配置
work_mem = 64MB
shared_buffers = 4GB
effective_cache_size = 12GB
random_page_cost = 1.5
max_parallel_workers_per_gather = 4
EOF
]]{{RUN}}
```

重启数据库使配置生效：

`[[gs_ctl restart]]{{RUN}}`

验证配置：

`[[SHOW work_mem;]]{{RUN}}`

`[[SHOW shared_buffers;]]{{RUN}}`

**自动评分**：检查参数配置是否合理，是否根据场景进行了优化。

## 错误演示

尝试设置过大的 work_mem：

`[[SET work_mem = '100GB';]]{{RUN}}`

说明：work_mem 过大会导致内存分配失败。应该根据可用内存和并发连接数合理设置。

尝试设置过小的 shared_buffers：

```
[[
cat >> /opt/gaussdb/data/postgresql.conf << 'EOF'
shared_buffers = 8KB
EOF
]]{{RUN}}
```

说明：shared_buffers 过小会导致性能严重下降。应该设置为系统内存的 25%-40%。
