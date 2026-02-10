### 日常维护与监控

在企业生产环境中，日常维护是保障数据库稳定运行的基石。本步骤介绍常用的运维工具和监控方法。

#### 核心运维工具

**1. gs_om - 集群管理工具**

查询集群状态：
[[gs_om -t status]]{{RUN}}

查看集群详细信息：
[[gs_om -t status --detail]]{{RUN}}

**2. gs_ctl - 实例管理工具**

启动实例：
[[gs_ctl start -D /data/opengauss/data]]{{RUN}}

停止实例：
[[gs_ctl stop -D /data/opengauss/data]]{{RUN}}

查看实例状态：
[[gs_ctl status -D /data/opengauss/data]]{{RUN}}

**3. gs_check - 健康检查工具**

执行健康检查：
[[gs_check -e inspection]]{{RUN}}

**最佳实践**: 在银行系统中，建议设置定时任务每小时检查集群状态，并在发现异常时自动发送告警。

#### 监控关键指标

生产环境中需要监控的关键指标：

1. **资源使用**: CPU、内存、磁盘IO、网络流量
2. **连接数**: 活跃连接数、最大连接数
3. **查询性能**: 慢查询数量、查询响应时间
4. **复制延迟**: 主备同步延迟
5. **锁等待**: 锁冲突和等待时间

查询当前连接数：
[[select count(*) from pg_stat_activity;]]{{RUN}}

查询慢查询：
[[select * from pg_stat_statements order by total_time desc limit 10;]]{{RUN}}

#### 金融场景运维实践

银行系统的运维要求：

- **7×24监控**: 全天候监控系统状态
- **快速响应**: 异常告警后5分钟内响应
- **预防性维护**: 定期检查和预防故障
- **变更管理**: 所有运维变更需经过审批流程

## 任务

1. 查询集群健康状态：
[[gs_om -t status --detail]]{{RUN}}

2. 检查当前活跃连接：
[[select count(*) from pg_stat_activity where state = 'active';]]{{RUN}}

**验证结果**: 确保集群状态正常，连接数在合理范围内。

**规范CheckList**:
- [ ] 了解gs_om、gs_ctl、gs_check的用途
- [ ] 能够查询集群和实例状态
- [ ] 理解监控的关键指标
- [ ] 掌握金融场景的运维要求
- [ ] 能够制定运维监控计划

[验证结果]：自评你的答案是否覆盖关键点。
