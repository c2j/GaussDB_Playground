### 备份策略与实践

备份是数据安全的最后一道防线，需要制定完整的备份策略。

#### 1. 备份类型

**物理备份（gs_basebackup）**:
- 备份整个数据库集群
- 增量备份支持
- 快速恢复

**逻辑备份（gs_dump）**:
- 备份指定表或数据库
- 跨版本迁移
- 灵活恢复

**差异备份**:
- 基于上次备份的差异
- 节省空间和时间

#### 2. gs_basebackup实践

全量备份：
[[gs_basebackup -D /backup/full -F p -X stream -P 3 -U omm -W password]]{{RUN}}

增量备份：
[[gs_basebackup -D /backup/inc -F p -X stream -P 3 -U omm -W password -C /backup/full]]{{RUN}}

#### 3. 备份策略

**银行系统备份策略**:

- **全量备份**: 每日凌晨2点
- **增量备份**: 每6小时
- **保留策略**: 全量保留30天，增量保留7天
- **异地备份**: 每日备份传输到异地灾备中心
- **备份验证**: 每周恢复测试

#### 4. 恢复实践

停止数据库服务：
[[gs_ctl stop -D /data/opengauss/data]]{{RUN}}

恢复全量备份：
[[cp -r /backup/full/* /data/opengauss/data/]]{{RUN}}

启动数据库：
[[gs_ctl start -D /data/opengauss/data]]{{RUN}}

验证数据完整性：
[[select count(*) from transactions;]]{{RUN}}

#### 新手训练场：故障注入

模拟备份失败场景：
1. 删除部分数据文件
2. 尝试启动数据库（会失败）
3. 恢复备份
4. 验证数据恢复成功

#### 规范CheckList**:
- [ ] 掌握gs_basebackup的使用
- [ ] 理解不同备份类型的区别
- [ ] 能够制定备份策略
- [ ] 掌握备份恢复流程
- [ ] 了解银行系统的备份要求

[验证结果]：自评你的答案是否覆盖关键点。
