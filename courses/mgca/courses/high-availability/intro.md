## 学习目标

本章节将帮助您掌握 GaussDB 高可用架构的设计和实施，确保数据库服务的连续性和数据安全。

**学完本章，您将能够：**
- 理解高可用架构的基本概念和模式
- 掌握主备部署和配置方法
- 理解故障切换机制和切换流程
- 掌握多节点集群的管理
- 了解跨区域容灾方案
- 实现高可用监控和故障处理

## 业务场景

**金融系统高可用需求**

某银行核心交易系统需要7×24小时不间断服务：
- 系统可用性要求: 99.999%
- 故障恢复时间: < 1分钟
- 数据持久性: RPO < 1秒
- 支持多地容灾

运维团队需要：
1. 设计高可用架构满足可用性要求
2. 配置主备自动切换
3. 实现跨区域容灾
4. 建立完善的监控和告警机制

通过本章学习，您将能够：
- 设计满足业务需求的高可用架构
- 配置和管理主备集群
- 实现自动故障切换
- 设计跨区域容灾方案

## 学习内容

本章节包含以下步骤：
1. **HA 架构和概念** - 了解高可用架构类型和原理
2. **主备配置** - 配置主备同步和复制
3. **故障切换和切换** - 理解故障检测和切换机制
4. **多节点集群** - 管理复杂的高可用集群
5. **跨区域容灾** - 设计和实施容灾方案

通过本章学习，您将能够：
- 设计满足业务需求的高可用架构
- 配置和管理主备集群
- 实现自动故障切换
- 设计跨区域容灾方案

**高可用故障案例：主备切换失败分析**

某金融核心业务系统采用 GaussDB 主备架构，在业务高峰期发生主库故障时，自动切换流程失败，导致服务中断超过 15 分钟，造成重大业务损失。

**故障现象**:
- 主库突然宕机（进程崩溃）
- 自动切换脚本未成功执行
- 备库在故障时刻未同步完整数据
- 应用程序无法连接到新主库
- 监控系统未及时触发告警
- 业务服务中断 15+ 分钟

**问题分析**:
1. **切换脚本缺陷**：
   - 异常处理逻辑不完整，未考虑所有失败场景
   - 重试次数过少（仅 1 次），无法应对临时网络抖动
   - 切换超时设置过短（30 秒），网络波动时执行失败
   - 缺少回滚机制，切换失败时无法快速恢复原状态

2. **监控机制不完善**：
   - 主库宕机后，监控系统延迟检测到异常（检测间隔 60 秒）
   - 未配置自动切换告警，依赖人工发现
   - 缺少切换进程的实时日志输出和状态追踪

3. **数据一致性风险**：
   - 切换发生时，部分事务未同步完成
   - 主库故障期间写入的事务在恢复后可能丢失
   - 缺少数据一致性验证机制

4. **网络分区问题**：
   - 业务系统和数据库部署在同一物理机房
   - 未做网络分区隔离，故障影响范围扩大
   - 缺乏跨机房网络冗余设计

**解决方案**:
1. **改进切换脚本**：
   ```bash
   # 改进的自动切换脚本
   #!/bin/bash
   
   # 配置变量
   PRIMARY_HOST="10.1.1.10"
   STANDBY_HOST="10.1.1.11"
   REPO_DIR="/opt/gaussdb/scripts"
   LOG_DIR="/opt/gaussdb/log/ha"
   TIMEOUT=30  -- 30秒超时
   MAX_RETRY=5  -- 最多重试 5次
   RETRY_DELAY=5  -- 重试间隔 5秒
   
   # 函数：检查主库健康
   check_primary_health() {
       for i in $(seq 1 $MAX_RETRY); do
           if gs_ctl -D /data/gaussdb status | grep -q "running"; then
               echo "$(date '+%Y-%m-%d %H:%M:%S') - Primary is healthy"
               return 0
           else
               echo "$(date '+%Y-%m-%d %H:%M:%S') - Primary not responding, attempt $i/$MAX_RETRY"
               sleep $RETRY_DELAY
           fi
       done
       echo "$(date '+%Y-%m-%d %H:%M:%S') - Primary check failed, proceeding with failover"
       return 1
   }
   
   # 函数：执行切换
   execute_failover() {
       echo "$(date '+%Y-%m-%d %H:%M:%S') - Executing failover..."
       
       # 停止应用
       [[systemctl stop app-service]]{{RUN}}
       
       # 检查备库同步状态
       if gs_ctl -D /data/gaussdb status | grep -q "standby and streaming"; then
               echo "$(date '+%Y-%m-%d %H:%M:%S') - Standby is synchronized"
       else
               echo "$(date '+%Y-%m-%d %H:%M:%S') - Standby not synchronized, aborting failover"
               exit 1
       fi
       
       # 切换 DNS 指向新主库
       [[echo "10.1.1.11 app.primary" | nslookup 10.1.1.10]]{{RUN}}
       
       # 切换应用连接
       [[systemctl start app-service]]{{RUN}}
       
       # 验证新连接
       if gsql -h 10.1.1.11 -p 5432 -c "SELECT NOW();" 2>&1 | grep -q "now()"; then
               echo "$(date '+%Y-%m-%d %H:%M:%S') - Switch to new primary successful"
       else
               echo "$(date '+%Y-%m-%d %H:%M:%S') - New primary connection failed"
               exit 1
       fi
   }
   
   # 主流程
   check_primary_health
   if [ $? -eq 0 ]; then
       execute_failover
   fi
   ```
   
   # 保存为可执行脚本
   [[chmod +x /opt/gaussdb/scripts/ha_failover.sh]]{{RUN}}
   ```

2. **完善监控机制**：
   ```bash
   # 1. 健康检查配置（缩短检测间隔）
   # postgresql.conf
   shared_preload_libraries = 'pg_stat_statements'
   auto_explain_log_min_duration = 1000  -- 记录慢查询
   log_min_duration_statement = 2000  -- 记录慢语句
   
   # 2. 创建监控视图
   CREATE VIEW v_ha_status AS
   SELECT
       node_name,
       host,
       role,
       current_lsn,
       replay_lag,
       sync_state
   FROM pg_stat_replication;
   
   # 3. 配置告警规则
   -- 通过外部监控系统（如 Prometheus）配置
   # prometheus.yml
   alerting:
     rules:
       - alert: primary_down
         expr: up == 0
         for: 30s
         labels:
           severity: critical
       - alert: replication_lag_high
         expr: lag_bytes > 1000000
         for: 60s
         labels:
           severity: warning
   ```

3. **数据一致性保障**：
   ```sql
   -- 1. 配置同步模式
   -- postgresql.conf
   synchronous_commit = on  -- 确保事务在主库提交后才返回成功
   synchronous_standby_names = '*'  -- 等待所有备库同步
   
   -- 2. 建立数据验证机制
   CREATE TABLE data_consistency_check (
       id BIGSERIAL PRIMARY KEY,
       check_time TIMESTAMP,
       primary_count BIGINT,
       standby_count BIGINT,
       difference BIGINT,
       status VARCHAR(20)
   );
   
   -- 创建定期验证任务
   CREATE OR REPLACE FUNCTION verify_consistency()
   RETURNS VOID AS $$
   BEGIN
       INSERT INTO data_consistency_check (check_time, primary_count, standby_count, difference, status)
       SELECT 
           NOW(),
           (SELECT COUNT(*) FROM table_name),
           (SELECT COUNT(*) FROM table_name),
           ABS((SELECT COUNT(*) FROM table_name) - (SELECT COUNT(*) FROM table_name)),
           CASE 
               WHEN ABS((SELECT COUNT(*) FROM table_name) - (SELECT COUNT(*) FROM table_name)) = 0 THEN 'consistent'
               WHEN ABS((SELECT COUNT(*) FROM table_name) - (SELECT COUNT(*) FROM table_name)) <= 10 THEN 'minor_diff'
               ELSE 'significant_diff'
           END;
   END;
   $$ LANGUAGE plpgsql;
   
   -- 配置定时验证
   -- 通过 cron 定期执行
   -- crontab -e
   # 0 */10 * * * * psql -h $STANDBY_HOST -U omm -d $DB_NAME -c 'SELECT verify_consistency();'
   ```

4. **网络分区优化**：
   ```bash
   # 1. 物理隔离 - 业务系统和数据库分机房
   # 网络规划
   Business System: 192.168.1.100.0/24  -- 业务网段
   Database Cluster A: 192.168.2.100.0/24  -- 数据库集群 A
   Database Cluster B: 192.168.3.100.0/24  -- 数据库集群 B
   
   # 2. 跨机房冗余
   # 使用专线或 VPN 连接两个机房
   # 配置心跳检测
   ping -i 1 -W 1 10.2.1.1
   
   # 3. 故障隔离方案
   # 如果整个机房故障，另一个机房仍可提供服务
   # 确保应用配置连接超时和重试机制
   ```

**改进效果**:
- 自动切换成功率从 30% 提升到 95%
- 切换时间从 30 秒（成功时）降至 10 秒
- 监控延迟从 60 秒降至 10 秒
- 故障后业务中断时间从 15 分钟降至 2 分钟

**最佳实践清单**:
- [ ] 设计完善的重试机制和超时控制
- [ ] 实现切换前的数据一致性检查
- [ ] 配置实时监控和快速告警
- [ ] 建立回滚机制，失败时快速恢复
- [ ] 定期进行故障演练和压力测试
- [ ] 记录详细的故障日志和分析报告
- [ ] 优化网络分区和跨机房冗余
- [ ] 建立完善的应急响应流程
- [ ] 培训运维团队故障处理能力

通过分析此案例，学习如何设计和实施高可用架构，确保主备切换的可靠性和数据一致性，最小化故障对业务的影响。

- <font color=darkred>*注意: 本章节需要您已经完成"GaussDB 架构与原理"、"安装与配置"和"备份与恢复"章节的学习*</font>

<font color=darkred>*注意: 本章节需要您已经完成"GaussDB 架构与原理"、"安装与配置"和"备份与恢复"章节的学习*</font>

## 前置要求

- 完成"GaussDB 架构与原理"章节（理解 WAL 和复制）
- 完成"安装与配置"章节（能够安装和配置实例）
- 完成"备份与恢复"章节（理解备份和恢复）
- 具备基本的网络和 Linux 系统操作能力
