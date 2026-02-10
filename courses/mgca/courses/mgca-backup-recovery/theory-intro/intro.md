## 学习目标

本章节将帮助您掌握 GaussDB 的备份和恢复技能，确保数据安全和业务连续性。

**学完本章，您将能够：**
- 理解备份的基本概念和策略
- 掌握物理备份和恢复方法
- 掌握逻辑备份和恢复方法
- 实现时点恢复（PITR）
- 配置备份自动化和调度
- 制定合理的备份策略

## 业务场景

**金融机构数据保护**

某金融机构需要确保核心交易数据的绝对安全：
- RPO（恢复点目标）: < 1秒
- RTO（恢复时间目标）: < 30分钟
- 每日交易数据量: 数百万条
- 历史数据保留: 7年

DBA 团队需要：
1. 制定完善的备份策略
2. 实现每日自动备份
3. 确保能够快速恢复
4. 定期测试恢复流程

通过本章学习，您将能够：
- 选择合适的备份类型（物理/逻辑）
- 配置 WAL 归档实现 PITR
- 自动化备份流程
- 在需要时快速恢复数据

**数据损坏恢复案例：磁盘故障和数据恢复**

某电商平台的订单系统在维护期间发生严重数据损坏事故，导致部分订单数据丢失，影响订单查询和结算功能。

**故障现象**:
- 系统维护后启动失败，数据库无法启动
- 错误日志显示数据文件损坏
- 无法读取订单表数据
- WAL 文件在损坏点后不完整
- 业务系统订单查询功能完全不可用

**问题分析**:
1. **磁盘故障导致数据损坏**：
   - 存储设备硬件故障，部分扇区不可读
   - 数据文件头部损坏，数据库无法识别表结构
   - 系统崩溃时正在写入的数据未完全落盘

2. **备份策略不完善**：
   - 最近一次完整备份是 3 天前
   - 增量备份间隔过长（6 小时）
   - 未配置 WAL 实时归档
   - 灾难恢复流程未测试过

3. **监控和告警缺失**：
   - 磁盘 SMART 信息未监控
   - 未配置存储设备健康检查
   - 磁盘 I/O 异常未及时发现

4. **恢复窗口不足**：
   - 业务要求 RPO < 5 分钟，实际 RPO 达到 6 小时
   - 业务要求 RTO < 30 分钟，实际恢复时间超过 2 小时

**解决方案**:
1. **紧急数据恢复流程**：
   ```bash
   # 1. 评估损坏范围
   [[gs_ctl -D /data/gaussdb status]]{{RUN}}

   # 2. 尝试从最近完整备份恢复
   cd /data/backups
   tar -xzf basebackup_20250205.tar.gz -C /data/gaussdb_restore

   # 3. 应用 WAL 归档到损坏点
   # 配置 restore_command 从归档目录恢复 WAL
   cat >> /data/gaussdb_restore/postgresql.conf << EOF
   restore_command = 'cp /data/gaussdb/wal_archive/%f %p'
   recovery_target_time = '2025-02-08 14:30:00'  -- 损坏发生前的时间点
   EOF

   # 4. 启动恢复的数据库
   gs_ctl -D /data/gaussdb_restore start

   # 5. 验证数据完整性
   gsql -p 5432 -d postgres -c "
   SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
   FROM pg_stat_user_tables
   WHERE schemaname = 'orders';
   "

   # 6. 导出关键表数据
   gs_dump -h localhost -p 5432 -U omm -d orders_db \
     -t order_details -f order_details_backup.sql
   ```

2. **从逻辑备份补充丢失数据**：
   ```bash
   # 1. 查找最近的逻辑备份
   ls -lt /data/logical_backups/ | head -10

   # 2. 恢复逻辑备份到临时数据库
   gs_restore -h localhost -p 5432 -U omm -d temp_orders \
     /data/logical_backups/orders_daily_20250208.dump

   # 3. 对比和合并数据
   gsql -h localhost -p 5432 -d temp_orders << EOF
   -- 查找物理备份中丢失的订单
   SELECT o.id, o.order_date, o.amount
   FROM orders o
   WHERE o.order_date >= '2025-02-08 00:00:00'
     AND o.order_date <= '2025-02-08 14:30:00';
   EOF

   # 4. 导出增量数据
   gs_dump -h localhost -p 5432 -U omm -d temp_orders \
     -t orders -a --where="order_date >= '2025-02-08'" \
     -f missing_orders.sql

   # 5. 导入到生产数据库
   gsql -h localhost -p 5432 -U omm -d orders_db < missing_orders.sql
   ```

3. **改进备份策略**：
   ```bash
   # 1. 配置 WAL 实时归档（实现 RPO < 5 分钟）
   cat >> /data/gaussdb/postgresql.conf << EOF
   # WAL 归档配置
   archive_mode = on
   archive_command = 'test ! -f /data/gaussdb/wal_archive/%f && cp %p /data/gaussdb/wal_archive/%f'
   wal_level = replica
   max_wal_senders = 3

   # PITR 配置
   wal_keep_segments = 100
   archive_timeout = 300  -- 5 分钟归档一次
   EOF

   # 2. 创建备份脚本（完整备份 + 增量备份）
   #!/bin/bash
   # backup_strategy.sh

   BACKUP_DIR="/data/backups"
   WAL_ARCHIVE="/data/gaussdb/wal_archive"
   DATE=$(date +%Y%m%d)
   TIME=$(date +%H%M%S)

   # 完整备份（每日凌晨 2 点）
   full_backup() {
       echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting full backup"
       gs_basebackup -D ${BACKUP_DIR}/full_${DATE}_${TIME} \
           -Fp -Xs -P -v -l "full_backup_${DATE}_${TIME}"
       tar -czf ${BACKUP_DIR}/basebackup_${DATE}_${TIME}.tar.gz \
           -C ${BACKUP_DIR} full_${DATE}_${TIME}
       rm -rf ${BACKUP_DIR}/full_${DATE}_${TIME}
       echo "$(date '+%Y-%m-%d %H:%M:%S') - Full backup completed"
   }

   # 逻辑备份（每 6 小时）
   logical_backup() {
       echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting logical backup"
       gs_dump -h localhost -U omm -d orders_db \
           -f ${BACKUP_DIR}/logical_${DATE}_${TIME}.sql \
           --format=plain --oids --schema=public
       echo "$(date '+%Y-%m-%d %H:%M:%S') - Logical backup completed"
   }

   # 根据时间选择备份类型
   HOUR=$(date +%H)
   if [ "$HOUR" -eq 2 ]; then
       full_backup
   else
       logical_backup
   fi

   # 清理过期备份（保留 7 天）
   find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete
   find ${BACKUP_DIR} -name "*.sql" -mtime +7 -delete
   find ${WAL_ARCHIVE} -name "*.gz" -mtime +7 -delete
   ```

4. **监控和告警配置**：
   ```bash
   # 1. 磁盘健康监控
   # smartctl 工具监控磁盘 SMART 信息
   */5 * * * * /usr/sbin/smartctl -a /dev/sda | grep -E "SMART overall-health self-assessment|Raw_Read_Error_Rate|Reallocated_Sector_Ct" >> /var/log/disk_health.log

   # 2. 创建监控表
   CREATE TABLE backup_monitoring (
       id BIGSERIAL PRIMARY KEY,
       backup_type VARCHAR(20),
       backup_start_time TIMESTAMP,
       backup_end_time TIMESTAMP,
       backup_size BIGINT,
       status VARCHAR(20),
       error_message TEXT
   );

   -- 备份完成后记录
   INSERT INTO backup_monitoring (backup_type, backup_start_time, backup_end_time, backup_size, status)
   VALUES ('full_backup', NOW(), NOW(), pg_size_pretty(pg_database_size('orders_db')), 'success');

   # 3. 配置告警规则
   # 通过外部监控系统（如 Prometheus + Alertmanager）
   alerting:
     rules:
       - alert: backup_failed
         expr: backup_status == 0
         for: 10m
         labels:
           severity: critical
         annotations:
           summary: "Database backup failed"

       - alert: disk_health_degraded
         expr: disk_smart_status == 1
         for: 5m
         labels:
           severity: critical
         annotations:
           summary: "Disk health degraded, immediate action required"

       - alert: wal_archive_gap
         expr: wal_archive_lag_seconds > 600
         for: 5m
         labels:
           severity: warning
         annotations:
           summary: "WAL archive gap detected"
   ```

5. **建立恢复演练机制**：
   ```bash
   # 1. 自动化恢复测试脚本
   #!/bin/bash
   # disaster_recovery_drill.sh

   TEST_DB="dr_test_db"
   ORIGINAL_DB="orders_db"
   BACKUP_DIR="/data/backups"

   echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting disaster recovery drill"

   # 停止测试数据库（如果存在）
   gs_ctl -D /data/gaussdb_dr_test stop -m immediate

   # 恢复最新备份到测试环境
   LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/basebackup_*.tar.gz | head -1)
   tar -xzf $LATEST_BACKUP -C /data/gaussdb_dr_test

   # 配置恢复参数
   cat >> /data/gaussdb_dr_test/postgresql.conf << EOF
   port = 5433
   restore_command = 'cp /data/gaussdb/wal_archive/%f %p'
   EOF

   # 启动测试数据库
   gs_ctl -D /data/gaussdb_dr_test start

   # 验证数据
   gsql -p 5433 -d postgres -c "
   SELECT COUNT(*) AS record_count
   FROM ${TEST_DB}.orders;
   "

   # 生成恢复报告
   echo "$(date '+%Y-%m-%d %H:%M:%S') - Recovery drill completed"
   echo "Backup used: ${LATEST_BACKUP}" >> /var/log/dr_drill_report.log
   echo "Records recovered: $(gsql -p 5433 -tA -c 'SELECT COUNT(*) FROM orders.orders')" >> /var/log/dr_drill_report.log

   # 清理
   gs_ctl -D /data/gaussdb_dr_test stop -m immediate
   ```

**改进效果**:
- RPO 从 6 小时降至 5 分钟（通过 WAL 实时归档）
- RTO 从 2 小时降至 15 分钟（通过完善的恢复流程和演练）
- 磁盘故障预警时间从故障后缩短到故障前 24-48 小时
- 备份成功率从 85% 提升到 99.9%
- 恢复演练覆盖率从 0% 提升到每月一次

**最佳实践清单**:
- [ ] 配置 WAL 实时归档实现低 RPO
- [ ] 实施完整备份 + 逻辑备份混合策略
- [ ] 定期进行灾难恢复演练（至少每月一次）
- [ ] 监控磁盘健康状态和 SMART 信息
- [ ] 建立多层备份策略（本地 + 异地）
- [ ] 配置备份和恢复的自动化告警
- [ ] 记录详细的恢复操作日志和报告
- [ ] 制定数据恢复的应急响应流程
- [ ] 定期清理过期备份避免磁盘占满
- [ ] 培训团队恢复操作和故障处理

通过分析此案例，学习如何设计完善的备份策略和快速恢复流程，确保在数据损坏场景下最小化数据丢失和业务中断时间。

## 学习内容

本章节包含以下步骤：
1. **备份概念和策略** - 了解备份类型、策略和 RPO/RTO
2. **物理备份** - 使用 gs_basebackup 进行物理备份
3. **逻辑备份** - 使用 gs_dump/gs_restore 进行逻辑备份
4. **时点恢复** - 实现 PITR 恢复
5. **备份自动化** - 配置自动备份和调度

<font color=darkred>*注意: 本章节需要您已经完成"GaussDB 架构与原理"、"安装与配置"和"SQL 开发基础"章节的学习*</font>

## 前置要求

- 完成"GaussDB 架构与原理"章节（理解 WAL 机制）
- 完成"安装与配置"章节
- 完成"SQL 开发基础"章节
- 了解基本的 Linux 系统操作
