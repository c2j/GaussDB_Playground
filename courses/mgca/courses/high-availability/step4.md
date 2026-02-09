# 多节点集群

## 集群架构

### CM（集群管理器）

**作用**: 管理和控制整个集群
- 监控所有节点状态
- 自动故障检测和切换
- 集中式配置管理

**部署**: 通常在独立服务器部署

### CN（协调节点）

**作用**: 接收客户端请求，协调查询执行
- SQL 解析和优化
- 任务分发
- 结果汇总

**特点**: 无状态，可以水平扩展

### DN（数据节点）

**作用**: 存储和处理数据
- 数据分片和复制
- 事务管理
- 数据持久化

**特点**: 有状态，存储实际数据

## 集群拓扑

### 1CN+3DN 集群

```
        ┌─────────┐
        │   CM    │
        └────┬────┘
             │
      ┌────┴────┐
      │   CN    │
      └────┬────┘
           │
    ┌────┴────┐
    │         │
┌───┴───┐ ┌───┴───┐ ┌───┴───┐
│ DN-1  │ │ DN-2  │ │ DN-3  │
└────────┘ └────────┘ └────────┘
```

### 2CN+3DN + 1CM 集群

```
        ┌─────────┐
        │   CM    │
        └─────────┘
             │
      ┌────┴────┐
      │   CN-1  │
      └────┬────┘
           │
      ┌────┴────┐
      │         │
┌───┴───┐ ┌───┴───┐ ┌───┴───┐
│ DN-1  │ │ DN-2  │ │ DN-3  │
└────────┘ └────────┘ └────────┘
```

## 集群部署

### 安装 CM

```bash
# 解压集群管理器
tar -zxvf GaussDB_Kernel_*.tar.gz -C /opt/

# 安装 CM
/opt/install/script/gs_install -U omm:dbgrp \
  -M cm \
  -l \
  --config-file=cluster_config.xml
```

### 安装 CN

```bash
# 安装协调节点
/opt/install/script/gs_install -U omm:dbgrp \
  -M cn \
  -n 2 \
  -l \
  --config-file=cluster_config.xml
```

### 安装 DN

```bash
# 安装数据节点
/opt/install/script/gs_install -U omm:dbgrp \
  -M dn \
  -n 3 \
  -l \
  --config-file=cluster_config.xml
```

## 数据分布

### 分布键

**作用**: 决定数据如何分布到不同 DN

**选择原则**:
- 选择高基数字列
- 避免数据倾斜
- 考虑查询模式

**示例**:
```sql
-- 使用用户 ID 作为分布键
CREATE TABLE orders (
    order_id INT,
    user_id INT,
    ...
) DISTRIBUTE BY HASH(user_id);
```

### 复制表

**作用**: 在多个 DN 上创建数据副本

**副本数**:
- 1 副本: 1 个主副本
- 2 副本: 1 主 + 1 备副本
- 3 副本: 1 主 + 2 备副本

**示例**:
```sql
-- 创建 2 副本表
CREATE TABLE products (
    product_id INT,
    ...
) DISTRIBUTE BY HASH(product_id)
TO GROUP GROUP1 WITH (3,2);
```

## 集群管理

### 查看集群状态

```bash
# 使用 CM 工具
gs_om -t status

# 查看节点列表
gs_om -t list --node

# 查看集群配置
gs_om -t query --cluster
```

### 启动/停止节点

```bash
# 停止节点
gs_ctl stop -D /opt/gaussdb/data/dn1

# 启动节点
gs_ctl start -D /opt/gaussdb/data/dn1

# 重启节点
gs_ctl restart -D /opt/gaussdb/data/dn1
```

### 节点扩容

**添加新 DN**:
```bash
# 使用 CM 工具
gs_expansion --table-name=orders \
  --add-node=dn4 \
  --skip-incremental-check
```

## 负载均衡

### CN 负载均衡

**连接池**: 使用连接池管理 CN 连接
**读写分离**: 读请求分发到备副本
**会话亲和**: 确保同一会话连接到同一 CN

### DN 负载均衡

**数据重新分布**:
```sql
-- 重新分布数据到新节点
ALTER TABLE orders DISTRIBUTE BY REPLICATE;
```

**副本重新平衡**:
```bash
# 使用 CM 工具
gs_rebalance --table=orders --group=GROUP1
```

## 性能优化

### 集群级优化

- 合理设置分布键避免数据倾斜
- 选择合适的副本数平衡性能和成本
- 优化网络配置减少节点间延迟
- 使用并行查询利用集群资源

### 查询优化

```sql
-- 使用 HINT 优化器
SELECT /*+ REPLICATE */ * FROM orders WHERE user_id = 1;

-- 查看执行计划
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;
```

## 监控告警

### 集群监控指标

- 节点状态（启动/停止）
- 复制延迟
- 连接数
- 查询响应时间
- 数据分布均匀性

### 告警配置

- 节点宕机告警
- 复制延迟过高告警
- 查询性能下降告警
- 磁盘空间不足告警

## Tips

**集群最佳实践**:
- 合理规划集群拓扑
- 选择合适的分布键
- 配置合适的副本数
- 定期检查集群状态
- 监控数据分布均衡性

**性能优化**:
- 避免数据倾斜
- 利用并行查询
- 优化跨节点查询
- 合理设置副本数

**企业规范**:
- [ ] 制定集群拓扑规划
- [ ] 选择合适的分布键
- [ ] 配置监控告警
- [ ] 定期检查集群状态
- [ ] 优化跨节点查询
- [ ] 制定扩容计划
- [ ] 测试故障恢复流程

## 任务

查看集群状态:

```bash
gs_om -t status --detail
```

查看节点列表:

```bash
gs_om -t list --node
```

查看数据分布:

```sql
-- 在系统视图查看数据分布
SELECT * FROM pgxc_node_group;
```

查看表分布:

```sql
SELECT * FROM pgxc_class WHERE relname = 'orders';
```

执行集群查询:

```sql
SELECT * FROM orders WHERE user_id = 1;
```

查看执行计划:

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;
```

**自动评分**: 验证集群查询正确，数据分布均衡，性能符合预期。

## 错误演示

数据倾斜:

```sql
-- 如果分布键选择不当
-- 某些 DN 数据量远大于其他 DN
SELECT count(*) FROM orders GROUP BY user_id LIMIT 10;
```

说明: 需要选择高基数字均匀的分布键。

跨节点查询性能差:

```sql
-- 如果查询需要访问多个 DN
-- 可能导致性能下降
SELECT * FROM orders WHERE create_time > '2024-01-01';
```

说明: 需要优化查询或调整数据分布。
