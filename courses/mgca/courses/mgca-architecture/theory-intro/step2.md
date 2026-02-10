# 存储引擎与 WAL 机制

## 存储引擎架构

GaussDB 采用 B+ 树索引结构，支持行存和列存两种存储模式：

### 行存储模式
- **适用场景**: OLTP（在线事务处理）系统
- **特点**: 一行数据连续存储
- **优势**: 单行查询、插入、更新操作效率高
- **典型应用**: 交易系统、用户管理、订单处理

### 列存储模式
- **适用场景**: OLAP（在线分析处理）系统
- **特点**: 一列数据连续存储
- **优势**: 列式聚合、分析查询效率高
- **典型应用**: 数据仓库、报表分析、BI 系统

## 数据页结构

每个数据表被划分为多个固定大小的数据页（默认 8KB）：

### 页面结构
- **页头**: 存储页面元信息
- **元组数据**: 实际的数据行
- **空闲空间**: 可用空间指针
- **特殊空间**: 页面末尾的保留空间

### 索引页结构
- **B+ 树节点**: 支持范围查询和等值查询
- **叶子节点**: 存储实际的键值对和 TID
- **非叶子节点**: 存储范围划分信息

## WAL (Write-Ahead Logging) 机制

WAL 是 GaussDB 保证数据持久性和恢复能力的核心机制。

### WAL 原理

1. **写入顺序**: 先写 WAL 日志，再修改数据页
2. **持久性保证**: WAL 落盘即认为事务提交成功
3. **崩溃恢复**: 通过重放 WAL 日志恢复未持久化的事务

### WAL 日志内容

- **事务日志**: 记录所有修改操作
- **检查点日志**: 记录检查点时刻的数据页状态
- **恢复日志**: 用于系统崩溃后的恢复

### WAL 刷盘策略

- **同步刷盘**: fsync 同步写入磁盘（最安全但最慢）
- **异步刷盘**: 操作系统缓存批量写入（较快但可能丢失）
- **参数控制**: 通过 wal_sync_method 调整刷盘策略

## 检查点 (Checkpoint) 机制

检查点机制用于：
1. 定期将脏页写入磁盘
2. 记录 WAL 日志位置
3. 加速崩溃恢复速度
4. 控制磁盘空间使用

### 检查点类型

- **自动检查点**: 根据时间和 WAL 量自动触发
- **手动检查点**: 通过 CHECKPOINT 命令触发
- **快速检查点**: 在某些场景下执行快速检查点

## 理论验证

WAL 机制通过"先写日志再写数据"的原则，确保即使在数据页尚未落盘的情况下，系统崩溃也能通过重放日志恢复数据。

## Tips

**生产环境建议**：
- OLTP 场景使用行存储，OLAP 场景使用列存储
- 合理配置 checkpoint_segments 和 checkpoint_completion_target
- 高并发场景使用异步 WAL 刷盘以提高性能
- 定期监控 WAL 日志大小和增长速度

**故障案例**：
- **数据丢失风险**: 如果 WAL 日志未正确持久化，可能导致事务丢失
- **恢复缓慢**: WAL 日志过多会导致崩溃恢复时间过长
- **空间耗尽**: WAL 日志未及时清理会占用大量磁盘空间

**企业规范 Checklist**：
- [ ] 配置合理的 WAL 刷盘策略
- [ ] 监控 WAL 日志大小和刷盘延迟
- [ ] 定期执行手动检查点
- [ ] 配置 WAL 日志归档策略
- [ ] 测试崩溃恢复流程

## 任务

查看当前数据库的 WAL 配置：

`[[gsql -d postgres -p 5432 -c "SHOW wal_buffers;"]]{{RUN}}`

`[[gsql -d postgres -p 5432 -c "SHOW wal_sync_method;"]]{{RUN}}`

`[[gsql -d postgres -p 5432 -c "SHOW checkpoint_timeout;"]]{{RUN}}`

`[[gsql -d postgres -p 5432 -c "SHOW checkpoint_completion_target;"]]{{RUN}}`

查看当前检查点状态：

`[[gsql -d postgres -p 5432 -c "SELECT * FROM pg_stat_bgwriter;"]]{{RUN}}`

创建测试表并观察 WAL 生成：

```
[[CREATE TABLE test_wal (
    id INT PRIMARY KEY,
    data VARCHAR(100)
);]]{{RUN}}
```

插入测试数据：

`[[INSERT INTO test_wal SELECT generate_series(1, 1000), 'test data';]]{{RUN}}`

再次检查检查点状态：

`[[gsql -d postgres -p 5432 -c "SELECT * FROM pg_stat_bgwriter;"]]{{RUN}}`

**自动评分**：检查 WAL 配置是否合理，是否启用了合适的刷盘策略。

## 错误演示

如果尝试关闭 WAL 功能（不支持）：

`[[SET wal_level = minimal;]]{{RUN}}`

说明：GaussDB 强制要求启用 WAL，确保数据安全。在某些特殊场景下可以设置为 `minimal` 或 `replica`，但必须谨慎使用。
