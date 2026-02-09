### 高可用架构与故障切换

高可用（HA）架构是保障系统7×24小时服务的关键。

#### 1. 主备架构原理

**主节点（Primary）**:
- 处理所有读写请求
- 生成WAL日志并发送备节点
- 故障时停止提供服务

**备节点（Standby）**:
- 接收并应用WAL日志
- 只读服务（可配置）
- 主节点故障时切换为主节点

#### 2. 查看复制状态

查询主备状态：
[[select * from pg_stat_replication;]]{{RUN}}

查询复制延迟：
[[select * from pg_stat_wal_receiver;]]{{RUN}}

**自动评分**: 同步延迟 < 1s 为满分。

#### 3. 手动故障切换

在主节点故障时，执行以下步骤：

**步骤1**: 提升备节点
[[gs_ctl promote -D /data/opengauss/data]]{{RUN}}

**步骤2**: 更新应用连接配置
- 修改DNS或负载均衡器配置
- 指向新的主节点

**步骤3**: 验证服务恢复
[[select * from transactions limit 1;]]{{RUN}}

**步骤4**: 修复原主节点为备节点
[[gs_ctl build -D /data/opengauss/data]]{{RUN}}

#### 4. 自动故障切换（gs_ctl）

配置自动故障切换参数：
```postgresql.conf
synchronous_standby_names = 'standby1,standby2'
recovery_target_timeline = 'latest'
```

使用gs_ctl工具：
[[gs_ctl switchover -D /data/opengauss/data]]{{RUN}}

#### 5. 银行HA架构设计

**两地三中心架构**:
- **生产中心**: 主节点 + 本地备节点
- **同城灾备中心**: 实时同步备节点
- **异地灾备中心**: 异步备节点

**故障切换策略**:
- 主节点故障 → 本地备节点切换（RTO < 30s）
- 生产中心故障 → 同城灾备切换（RTO < 1min）
- 同城灾备故障 → 异地灾备切换（RTO < 5min）

#### 新手训练场：故障演练

模拟主节点故障：
1. 停止主节点：[[gs_ctl stop -D /data/opengauss/data]]{{RUN}}
2. 观察备节点自动提升或手动提升
3. 验证应用可以继续访问
4. 恢复原主节点为备节点

#### 规范CheckList**:
- [ ] 理解主备架构原理
- [ ] 掌握故障切换流程
- [ ] 能够设计HA架构
- [ ] 了解银行系统的HA要求
- [ ] 能够执行故障演练

[验证结果]：自评你的答案是否覆盖关键点。
