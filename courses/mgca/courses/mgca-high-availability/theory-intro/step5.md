# 跨区域容灾

## 容灾架构

### 主备容灾（异地容灾）

```
主数据中心              备数据中心
┌─────────┐          ┌─────────┐
│ 主节点  │  ◄──────▶│ 异地备节点 │
└─────────┘          └─────────┘
     │                      │
     └──────────────────────┘
         网络同步
```

### 双活容灾

```
主数据中心              备数据中心
┌─────────┐          ┌─────────┐
│ 活动节点 │ ◄───────▶│ 活动节点 │
└─────────┘          └─────────┘
     │                      │
     └──────────────────────┘
         双向同步
```

## 备份容灾策略

### 离线备份

**定义**: 备份到异地存储

**实现方式**:
- 定期物理备份到异地
- 云存储备份
- 磁带备份（传统方式）

**示例**:
```bash
# 备份到云存储
gs_basebackup -D /backup/full
rclone sync /backup/full remote:gaussdb-backups/

# 压缩传输
tar -czf backup.tar.gz /backup/full
scp backup.tar.gz remote:/backup/
```

### 在线容灾

**定义**: 实时或准实时异地同步

**实现方式**:
- WAL 日志归档到异地
- 异步流式复制
- 分布式数据库

**示例**:
```bash
# WAL 归档到异地
archive_command = 'scp %p backup-host:/archive/%f'

# 或使用 rsync
archive_command = 'rsync -avz %p backup-host:/archive/'
```

## 同步复制容灾

### 异步流式复制

**特点**:
- 数据实时或准实时同步
- 低延迟
- 自动故障检测和切换

**配置**:
```sql
-- 在主节点配置流式复制
SELECT pg_create_physical_replication_slot('repl_slot');
```

```bash
# 在备节点启动流式复制
pg_basebackup -h primary-host -D /data -P -R -S repl_slot -X stream
```

### 级联同步

**特点**:
- 数据库级同步
- 自动故障检测
- 快速切换

**配置**:
```sql
-- 在主节点配置
CREATE PUBLICATION pub_all FOR ALL TABLES;

-- 在备节点订阅
CREATE SUBSCRIPTION sub_all
CONNECTION 'primary-host'
PUBLICATION pub_all;
```

## 网络设计

### 专线连接

**优点**: 高带宽、低延迟、稳定
**缺点**: 成本高

### VPN 连接

**优点**: 成本低、灵活
**缺点**: 性能较差、受公网影响

### SD-WAN

**优点**: 性能好、支持智能路由
**缺点**: 成本中等

## 故障切换策略

### 主数据中心故障

**流程**:
1. 检测主数据中心故障
2. 启用备数据中心服务
3. 更新 DNS 或 VIP
4. 验证数据一致性
5. 通知相关人员

**自动化切换**:
```bash
#!/bin/bash
# 自动切换脚本

# 1. 检查主数据中心可达性
ping -c 3 primary-dc

if [ $? -ne 0 ]; then
    echo "Primary DC unreachable, switching to DR DC"
    
    # 2. 更新 DNS 或 VIP
    # 3. 启动备数据中心服务
    gs_ctl promote
    
    # 4. 发送告警
    # echo "Failover triggered" | mail -s "DR Alert" admin@example.com
fi
```

### 双活故障隔离

**故障场景**:
- 主数据中心网络分区
- 单个数据中心故障

**处理策略**:
- 自动检测网络分区
- 应用可连接到任一数据中心
- 数据在两个中心保持一致

## 数据一致性

### 强一致性

**同步复制**:
- 主备之间零延迟
- 确保数据一致性
- 影响主节点性能

### 最终一致性

**异步复制**:
- 有一定延迟
- 可能有数据丢失
- 主节点性能好

### 数据验证

```sql
-- 比较两个中心的数据行数
SELECT count(*) FROM table_name;
```

## 监控告警

### 跨区域监控

- 网络延迟监控
- 数据同步延迟监控
- 复制状态监控
- 节点状态监控

### 告警配置

- 网络分区告警
- 备数据中心告警
- 同步延迟过高告警
- 数据不一致告警

## 演练测试

### 定期演练

- 季度: 每月或每季度
- 范围: 模拟真实故障
- 记录: 详细记录演练结果
- 改进: 根据演练结果改进

### 演练内容

- 主数据中心故障切换
- 网络分区处理
- 数据恢复测试
- 应用容灾测试

## Tips

**容灾最佳实践**:
- 制定详细的容灾计划
- 定期演练故障恢复
- 监控网络和数据同步
- 验证数据一致性
- 准备快速恢复方案

**架构选择**:
- 主备容灾: 成本低，切换快
- 双活容灾: 资源利用率高，切换透明
- 选择标准: RTO/RPO 要求、成本预算

**企业规范**:
- [ ] 制定详细的容灾计划
- [ ] 定义 RPO/RTO 目标
- [ ] 选择合适的容灾架构
- [ ] 配置网络和存储
- [ ] 实施监控告警
- [ ] 定期演练测试
- [ ] 验证数据一致性

## 任务

检查复制状态:

```sql
SELECT * FROM pg_stat_replication;
```

查看同步延迟:

```sql
SELECT
    now() - replay_timestamp AS lag_seconds
FROM pg_stat_replication;
```

查看异地连接:

```bash
ping -c 3 dr-host
telnet dr-host 5432
```

测试网络带宽:

```bash
# 测试传输速度
dd if=/dev/zero of=/dev/null bs=1M count=1000 | ssh dr-host 'dd of=/dev/null'
```

配置备份到异地:

```bash
# 备份并传输到异地
gs_basebackup -D /backup/dr_full
rsync -avz --delete /backup/dr_full dr-host:/backups/
```

验证异地备份:

```bash
ssh dr-host 'ls -lh /backups/dr_full'
```

测试故障切换:

```bash
# 模拟主节点故障
gs_ctl stop -m immediate

# 提升异地备节点
gs_ctl promote

# 验证
SELECT pg_is_in_recovery();
```

**自动评分**: 验证容灾配置正确，网络连接稳定，数据同步正常。

## 错误演示

网络中断:

```bash
# 网络中断导致复制延迟过大
ping dr-host

# 查看复制状态
SELECT * FROM pg_stat_replication;
```

说明: 需要监控网络状态，设置合理的告警阈值。

数据不一致:

```sql
-- 主备数据行数不一致
SELECT count(*) FROM table_name;
```

说明: 需要使用同步复制或定期验证数据一致性。
