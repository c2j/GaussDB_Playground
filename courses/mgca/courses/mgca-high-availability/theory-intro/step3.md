# 故障切换和切换

## 故障检测

### 主节点故障检测

**自动检测**:
- 主节点心跳超时
- 备节点无法连接主节点
- 集群管理器（CM）检测故障

**手动检测**:
```bash
# 在备节点检查主节点状态
ps aux | grep gaussdb

# 检查复制状态
SELECT * FROM pg_stat_replication;
```

### 备节点故障检测

**自动检测**:
- 备节点心跳超时
- 主节点无法同步到备节点
- CM 检测故障

## Failover（故障切换）

### 自动 Failover

**使用集群管理器（CM）**:
```bash
# CM 检测主节点故障
# 自动提升备节点为主
gs_ctl promote
```

**触发条件**:
- 主节点宕机
- 网络中断
- 超过心跳超时

### 手动 Failover

**提升备节点**:
```bash
# 在备节点执行
gs_ctl promote

# 验证新主节点
SELECT pg_is_in_recovery();
```

### Failover 流程

1. 检测主节点故障
2. 停止主节点连接
3. 提升备节点为主
4. 更新应用连接配置
5. 验证数据一致性
6. 告知相关人员

## Switchover（计划切换）

### 计划切换原因

- 硬件升级
- 系统维护
- 数据库升级
- 配置调整

### Switchover 流程

**准备阶段**:
1. 通知业务方
2. 备份当前配置
3. 检查系统状态
4. 准备回滚计划

**执行阶段**:
```bash
# 1. 在备节点停止应用写入
# 2. 等待备节点追赶
# 3. 停止主节点
gs_ctl stop

# 4. 在备节点提升为主
gs_ctl promote

# 5. 更新应用配置
# 6. 验证数据完整性
```

**验证阶段**:
1. 应用测试连接
2. 验证数据读写
3. 检查复制状态
4. 验证监控告警

## 切换优化

### 减少切换时间

**预热备节点**:
- 确保备节点数据同步
- 预加载热点数据
- 优化网络连接

**快速切换脚本**:
```bash
#!/bin/bash
# 快速切换脚本

# 停止主节点
gs_ctl stop -m fast

# 提升备节点
gs_ctl promote

# 更新 DNS 或 VIP
# ...
```

### 数据一致性保证

**同步模式**:
- 使用同步复制确保零丢失
- 在切换前等待数据同步完成

**数据验证**:
```sql
-- 在新旧主节点比较数据行数
SELECT count(*) FROM table_name;
```

## 监控告警

### 切换监控

**实时监控**:
- 复制延迟
- 节点状态
- 应用连接数
- 数据库性能

**告警触发**:
- 切换开始/完成
- 主备状态变化
- 复制延迟告警
- 应用连接失败

## 回滚方案

### Switchover 失败回滚

```bash
# 回滚计划
# 1. 停止新主节点
gs_ctl stop

# 2. 启动原主节点
gs_ctl start

# 3. 更新应用配置
# ...

# 4. 验证数据完整性
```

### Failover 后恢复

```bash
# 修复原主节点为备节点
# 1. 清理数据目录
rm -rf /opt/gaussdb/data/*

# 2. 从新主节点重新构建备节点
gs_basebackup -h new_primary -D /opt/gaussdb/data -P
```

## Tips

**切换最佳实践**:
- 制定详细的切换 SOP
- 在测试环境演练切换流程
- 准备回滚计划
- 通知所有相关方
- 使用监控工具跟踪切换过程

**故障处理**:
- 快速故障检测
- 自动化切换流程
- 数据一致性验证
- 完善的告警机制
- 详细的故障记录

**企业规范**:
- [ ] 制定切换 SOP
- [ ] 定期测试切换流程
- [ ] 准备回滚计划
- [ ] 使用监控工具
- [ ] 设置切换告警
- [ ] 记录切换过程
- [ ] 制定应急响应计划

## 任务

检查主备状态:

```sql
SELECT
    application_name,
    client_addr,
    state,
    sync_state,
    replay_lag
FROM pg_stat_replication;
```

查看当前同步模式:

```sql
SHOW synchronous_commit;
SHOW synchronous_standby_names;
```

测试手动提升备节点:

```bash
# 停止应用写入
# 在备节点执行
gs_ctl promote

# 验证
SELECT pg_is_in_recovery();
```

查看切换后的复制状态:

```sql
SELECT * FROM pg_stat_replication;
```

监控复制延迟:

```sql
SELECT
    now() - replay_timestamp AS lag_seconds,
    replay_location,
    sent_location
FROM pg_stat_replication;
```

检查数据库状态:

```bash
gs_ctl status
```

查看活跃连接:

```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

**自动评分**: 验证主备切换成功，数据一致性，复制恢复正常。

## 错误演示

数据不一致:

```sql
-- 如果切换后数据行数不一致
SELECT count(*) FROM table_name;
```

说明: 切换前应该确保数据同步完成，使用同步复制模式。

切换后应用无法连接:

```bash
# DNS 或 VIP 未更新
# 应用仍然连接到旧主节点
```

说明: 需要快速更新连接配置或 DNS/VIP。
