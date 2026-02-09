# MGCA GaussDB 认证课程 - 故障排查指南

本指南提供常见问题的诊断和解决方案，帮助您快速解决学习过程中遇到的问题。

## 目录

- [环境问题](#环境问题)
- [数据库连接问题](#数据库连接问题)
- [实验执行问题](#实验执行问题)
- [性能问题](#性能问题)
- [备份恢复问题](#备份恢复问题)
- [高可用问题](#高可用问题)
- [安全问题](#安全问题)
- [考试问题](#考试问题)

---

## 环境问题

### 问题 1: Docker 容器无法启动

**症状**:
- `docker-compose up` 后容器立即退出
- 状态显示 `Exit 1` 或 `Exit 137`

**可能原因**:
- 端口被占用
- 资源不足
- 配置文件错误
- 镜像下载失败

**诊断步骤**:
```bash
# 1. 查看容器状态
docker-compose ps

# 2. 查看容器日志
docker-compose logs <service_name>

# 3. 检查端口占用
netstat -tlnp | grep 5432
# 或
lsof -i :5432

# 4. 检查系统资源
free -h
df -h
docker stats
```

**解决方案**:

1. **端口被占用**:
   ```bash
   # 方案 1: 停止占用端口的服务
   sudo systemctl stop postgresql  # 如果本地安装了 PostgreSQL

   # 方案 2: 修改端口映射
   # 编辑 docker-compose.yml，将 5432 改为其他端口，如 5434
   ports:
     - "5434:5432"
   ```

2. **资源不足**:
   ```bash
   # 检查内存使用
   free -h

   # 如果内存不足，可以：
   # 1. 关闭其他应用
   # 2. 增加 swap 空间
   # 3. 降低容器内存限制（修改 docker-compose.yml）
   deploy:
     resources:
       limits:
         memory: 2G  # 从 4G 降低到 2G
   ```

3. **配置文件错误**:
   ```bash
   # 验证 YAML 语法
   docker-compose config

   # 如果有错误，会显示具体位置
   ```

4. **镜像下载失败**:
   ```bash
   # 手动拉取镜像
   docker pull gaussdb:5.0.0-enterprise

   # 查看镜像列表
   docker images

   # 如果网络问题，可以使用国内镜像源
   ```

### 问题 2: 容器启动但无法连接

**症状**:
- 容器状态为 `Up`
- `gsql` 连接超时或拒绝连接

**诊断步骤**:
```bash
# 1. 检查容器内部端口
docker exec -it <container_name> netstat -tlnp

# 2. 检查容器映射端口
docker port <container_name>

# 3. 测试容器内部连接
docker exec -it <container_name> gsql -h localhost -U omm -d postgres

# 4. 测试主机连接
gsql -h localhost -p 5432 -U omm -d postgres
```

**解决方案**:

1. **端口映射错误**:
   ```bash
   # 检查 docker-compose.yml 中的端口映射
   # 格式应为: "主机端口:容器端口"
   ports:
     - "5432:5432"
   ```

2. **数据库未启动**:
   ```bash
   # 进入容器检查数据库状态
   docker exec -it <container_name> bash
   gs_ctl -D /data/gaussdb status

   # 如果未启动，手动启动
   gs_ctl -D /data/gaussdb start
   ```

3. **防火墙阻止**:
   ```bash
   # 检查防火墙规则
   sudo iptables -L -n

   # 临时关闭防火墙测试（不推荐用于生产）
   sudo systemctl stop firewalld

   # 或添加允许规则
   sudo firewall-cmd --add-port=5432/tcp --permanent
   sudo firewall-cmd --reload
   ```

---

## 数据库连接问题

### 问题 3: gsql 命令找不到

**症状**:
- 执行 `gsql` 时提示 `command not found`

**可能原因**:
- 未安装 GaussDB 客户端
- PATH 环境变量未配置
- 容器内未安装客户端工具

**解决方案**:

1. **使用容器内 gsql**:
   ```bash
   # 在容器内执行 gsql
   docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres
   ```

2. **安装 GaussDB 客户端**:
   ```bash
   # 下载并安装 GaussDB 客户端（根据系统选择）
   # 参考 GaussDB 官方文档
   ```

3. **配置环境变量**:
   ```bash
   # 添加到 ~/.bashrc 或 ~/.zshrc
   export GAUSSHOME=/path/to/gaussdb
   export PATH=$GAUSSHOME/bin:$PATH
   export LD_LIBRARY_PATH=$GAUSSHOME/lib:$LD_LIBRARY_PATH

   # 重新加载配置
   source ~/.bashrc
   ```

### 问题 4: 认证失败

**症状**:
- 连接时提示 `authentication failed` 或 `password authentication failed`

**可能原因**:
- 密码错误
- 用户不存在
- 认证方式不匹配
- pg_hba.conf 配置问题

**解决方案**:

1. **检查用户名和密码**:
   ```bash
   # 默认用户名: omm
   # 默认密码: OpenGauss@123

   # 确认环境变量
   docker exec -it <container_name> env | grep GS
   ```

2. **重置密码**:
   ```bash
   # 进入容器
   docker exec -it mgca-gaussdb-primary bash

   # 连接数据库（使用信任认证）
   gsql -h localhost -U omm -d postgres

   # 重置密码
   ALTER USER omm WITH PASSWORD 'NewPassword@123';
   ```

3. **检查 pg_hba.conf**:
   ```bash
   # 查看 pg_hba.conf
   docker exec -it <container_name> cat /data/gaussdb/pg_hba.conf

   # 常见配置问题：
   # - 认证方式不匹配（如: md5 对 trust）
   # - 允许的主机范围不正确
   ```

---

## 实验执行问题

### 问题 5: 命令执行失败

**症状**:
- `[[command]]{{RUN}}` 执行后报错
- 错误信息不清楚

**诊断步骤**:
```bash
# 1. 查看完整错误信息
docker-compose logs -f <service_name>

# 2. 手动在容器内执行命令
docker exec -it <container_name> bash
# 然后手动执行失败的命令

# 3. 检查命令语法
# 在数据库内验证 SQL 语法
gsql -h localhost -U omm -d postgres -c "<command>"
```

**常见错误和解决方案**:

1. **SQL 语法错误**:
   ```
   错误: syntax error at or near "XXX"
   ```
   - 检查 SQL 语法
   - 确保关键字拼写正确
   - 检查括号和引号匹配

2. **表不存在**:
   ```
   错误: relation "XXX" does not exist
   ```
   - 检查表名拼写
   - 确认表在当前数据库中
   - 使用 `\dt` 列出所有表

3. **权限不足**:
   ```
   错误: permission denied for table XXX
   ```
   - 检查当前用户权限
   - 使用 `\du` 查看用户权限
   - 联系管理员授予权限

4. **数据类型不匹配**:
   ```
   错误: column "XXX" is of type XXX but expression is of type XXX
   ```
   - 检查数据类型
   - 使用类型转换函数
   - 修改表结构

### 问题 6: 自动评分失败

**症状**:
- 实验完成后评分失败
- 显示部分得分或 0 分

**可能原因**:
- 未达到评分标准
- 提交格式不正确
- 结果不完整

**解决方案**:

1. **查看评分标准**:
   - 仔细阅读实验的评分 checklist
   - 确保所有项目都完成
   - 检查是否有文档要求

2. **验证实验结果**:
   ```bash
   # 使用验证查询检查结果
   # 确保输出符合预期
   ```

3. **检查提交文件**:
   - 确认提交了所有必需文件
   - 检查文件格式是否正确
   - 确认文件内容完整

4. **联系支持**:
   - 如果确认实验正确但仍无法得分
   - 提供实验记录和错误信息
   - 联系技术支持

---

## 性能问题

### 问题 7: 查询非常慢

**症状**:
- 简单查询执行时间超过预期
- 大量查询超时

**诊断步骤**:
```sql
-- 1. 使用 EXPLAIN ANALYZE 分析查询
EXPLAIN ANALYZE SELECT * FROM your_table WHERE condition;

-- 2. 查看慢查询日志
-- 在日志目录查看慢查询

-- 3. 查看查询统计
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**解决方案**:

1. **创建索引**:
   ```sql
   -- 为常用查询条件创建索引
   CREATE INDEX idx_column ON table_name(column);

   -- 创建复合索引
   CREATE INDEX idx_columns ON table_name(column1, column2);
   ```

2. **优化查询语句**:
   ```sql
   -- 避免 SELECT *
   SELECT column1, column2 FROM table_name;

   -- 使用 JOIN 替代子查询
   SELECT t1.*, t2.*
   FROM table1 t1
   INNER JOIN table2 t2 ON t1.id = t2.t1_id;

   -- 使用 LIMIT 限制结果集
   SELECT * FROM table_name LIMIT 100;
   ```

3. **更新统计信息**:
   ```sql
   -- 更新表统计信息
   ANALYZE table_name;

   -- 更新所有表统计信息
   ANALYZE;
   ```

4. **调整参数**:
   ```bash
   # 修改 postgresql.conf
   shared_buffers = 4GB          # 增加共享缓冲区
   work_mem = 128MB              # 增加排序内存
   effective_cache_size = 12GB    # 增加有效缓存大小

   # 重启数据库生效
   gs_ctl -D /data/gaussdb restart
   ```

### 问题 8: 连接池耗尽

**症状**:
- 应用无法获取连接
- 错误信息包含 `too many clients`

**解决方案**:

```sql
-- 1. 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 2. 查看最大连接数
SHOW max_connections;

-- 3. 终止空闲连接
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND datname = 'your_database';

-- 4. 增加最大连接数
-- 修改 postgresql.conf
max_connections = 500

-- 5. 使用连接池
-- 配置应用连接池（如 PgBouncer, HikariCP）
```

---

## 备份恢复问题

### 问题 9: 备份失败

**症状**:
- `gs_dump` 或 `gs_basebackup` 执行失败
- 错误信息: `cannot dump` 或 `connection refused`

**诊断步骤**:
```bash
# 1. 检查数据库连接
gsql -h localhost -U omm -d postgres -c "SELECT 1;"

# 2. 检查磁盘空间
df -h

# 3. 检查备份目录权限
ls -la /data/backups/
```

**解决方案**:

1. **数据库连接问题**:
   ```bash
   # 确认数据库运行正常
   gs_ctl -D /data/gaussdb status

   # 检查连接参数
   gsql -h localhost -p 5432 -U omm -d postgres
   ```

2. **磁盘空间不足**:
   ```bash
   # 清理旧备份
   find /data/backups -mtime +7 -delete

   # 扩容磁盘或使用其他存储位置
   gs_dump -h localhost -U omm -d postgres -f /other/path/backup.sql
   ```

3. **权限问题**:
   ```bash
   # 确保备份目录可写
   chmod 755 /data/backups
   chown omm:omm /data/backups
   ```

### 问题 10: 恢复失败

**症状**:
- `gs_restore` 执行失败
- 数据导入不完整

**解决方案**:

1. **使用完整备份**:
   ```bash
   # 恢复时使用 --clean 选项
   gs_restore -h localhost -U omm -d postgres \
     --clean --if-exists -f backup.dump
   ```

2. **检查版本兼容性**:
   - 确认备份和恢复的数据库版本兼容
   - 必要时使用 --format=plain 或其他格式

3. **逐步恢复**:
   ```bash
   # 列出备份内容
   gs_restore -l backup.dump

   # 选择性恢复表
   gs_restore -h localhost -U omm -d postgres \
     -t table_name backup.dump
   ```

---

## 高可用问题

### 问题 11: 主备复制中断

**症状**:
- 备库日志显示 replication failed
- 查询 `pg_stat_replication` 无结果

**诊断步骤**:
```sql
-- 主库查询复制状态
SELECT * FROM pg_stat_replication;

-- 备库查询接收状态
SELECT * FROM pg_stat_wal_receiver;
```

**解决方案**:

1. **网络问题**:
   ```bash
   # 测试网络连通性
   ping <standby_host>
   telnet <standby_host> 5432

   # 检查防火墙
   iptables -L -n | grep 5432
   ```

2. **WAL 归档问题**:
   ```bash
   # 检查 WAL 归档目录
   ls -la /data/backups/wal/

   # 检查归档配置
   SHOW archive_mode;
   SHOW archive_command;
   ```

3. **重新建立复制**:
   ```bash
   # 在备库上重新建立复制
   gs_ctl -D /data/gaussdb stop

   # 删除旧数据
   rm -rf /data/gaussdb/*

   # 重新从主库备份
   gs_basebackup -h <primary_host> -D /data/gaussdb -U omm

   # 配置复制连接
   # 编辑 recovery.conf 或 postgresql.conf
   primary_conninfo = 'host=<primary_host> port=5432 user=omm'

   # 启动备库
   gs_ctl -D /data/gaussdb start
   ```

### 问题 12: 故障切换失败

**症状**:
- 自动切换脚本执行失败
- 新主库无法连接

**解决方案**:

1. **检查切换脚本**:
   ```bash
   # 查看脚本日志
   cat /var/log/ha_failover.log

   # 手动执行脚本测试
   bash /path/to/ha_failover.sh
   ```

2. **检查备库状态**:
   ```bash
   # 确认备库是最新状态
   gsql -h <standby_host> -U omm -d postgres \
     -c "SELECT NOW(), pg_last_xact_replay_timestamp();"

   # 确认备库可以提升
   gs_ctl -D /data/gaussdb promote
   ```

3. **检查应用连接**:
   ```bash
   # 更新应用连接配置
   # 指向新的主库地址
   ```

---

## 安全问题

### 问题 13: 审计日志未生成

**症状**:
- 启用审计后未生成审计日志
- 审计目录为空

**解决方案**:

```bash
# 1. 检查审计配置
docker exec -it <container_name> bash
grep audit /data/gaussdb/postgresql.conf

# 确保配置：
audit_enabled = on
audit_directory = '/data/gaussdb/audit'

# 2. 检查审计目录权限
ls -la /data/gaussdb/audit/

# 3. 重启数据库生效
gs_ctl -D /data/gaussdb restart

# 4. 执行审计操作后检查
ls -la /data/gaussdb/audit/
```

### 问题 14: SSL 连接失败

**症状**:
- SSL 连接被拒绝
- 错误: `SSL error: no ssl cipher found`

**解决方案**:

```bash
# 1. 生成 SSL 证书（如果没有）
cd /data/gaussdb
openssl req -new -x509 -days 365 -nodes -text \
  -out server.crt -keyout server.key

# 2. 配置 SSL
# 编辑 postgresql.conf
ssl = on
ssl_cert_file = '/data/gaussdb/server.crt'
ssl_key_file = '/data/gaussdb/server.key'

# 3. 配置 pg_hba.conf
hostssl all all 0.0.0.0/0 md5

# 4. 重启数据库
gs_ctl -D /data/gaussdb restart

# 5. 使用 SSL 连接
gsql "host=localhost port=5432 dbname=postgres user=omm sslmode=require"
```

---

## 考试问题

### 问题 15: 考试提交失败

**症状**:
- 考试答案提交失败
- 页面无响应

**解决方案**:

1. **检查网络连接**:
   ```bash
   # 测试网络连通性
   ping exam-server.com

   # 检查网络速度
   speedtest-cli
   ```

2. **检查答案格式**:
   - 确保答案格式正确（JSON, 文本等）
   - 检查文件大小限制
   - 重新组织答案内容

3. **联系监考人员**:
   - 如果持续无法提交
   - 保留答题草稿
   - 联系监考人员处理

### 问题 16: 成绩查询失败

**症状**:
- 无法查询考试成绩
- 系统提示错误

**解决方案**:

1. **等待成绩发布**:
   - 考试结束后需要阅卷时间
   - 通常 3-5 个工作日
   - 等待官方通知

2. **检查登录信息**:
   - 确认用户名和密码正确
   - 尝试重置密码
   - 联系管理员协助

3. **联系支持**:
   - 如果确实无法查询
   - 提供考试信息（姓名、准考证号、考试时间）
   - 联系客服处理

---

## 获取更多帮助

如果以上解决方案无法解决您的问题，请：

1. **查看完整日志**:
   ```bash
   # 收集所有相关日志
   docker-compose logs > all-logs.log
   docker exec -it <container_name> cat /data/gaussdb/log/*.log
   ```

2. **记录问题详细信息**:
   - 问题发生的时间
   - 执行的操作
   - 完整的错误信息
   - 环境配置信息

3. **联系支持**:
   - 在讨论区发布问题
   - 联系讲师或技术支持
   - 提供详细的问题描述和日志

---

**常见问题快速索引**:

| 问题类型 | 快速链接 |
|----------|----------|
| 容器启动失败 | [问题 1](#问题-1-docker-容器无法启动) |
| 连接失败 | [问题 2](#问题-2-容器启动但无法连接) |
| gsql 找不到 | [问题 3](#问题-3-gsql-命令找不到) |
| 认证失败 | [问题 4](#问题-4-认证失败) |
| 命令执行失败 | [问题 5](#问题-5-命令执行失败) |
| 自动评分失败 | [问题 6](#问题-6-自动评分失败) |
| 查询慢 | [问题 7](#问题-7-查询非常慢) |
| 连接池耗尽 | [问题 8](#问题-8-连接池耗尽) |
| 备份失败 | [问题 9](#问题-9-备份失败) |
| 恢复失败 | [问题 10](#问题-10-恢复失败) |
| 复制中断 | [问题 11](#问题-11-主备复制中断) |
| 切换失败 | [问题 12](#问题-12-故障切换失败) |
| 审计日志问题 | [问题 13](#问题-13-审计日志未生成) |
| SSL 问题 | [问题 14](#问题-14-ssl-连接失败) |
| 考试提交失败 | [问题 15](#问题-15-考试提交失败) |
| 成绩查询失败 | [问题 16](#问题-16-成绩查询失败) |

---

*本指南将持续更新，如有疑问请联系课程团队。*
