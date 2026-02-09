# 审计和合规日志

## 审计概述

### 审计目的

- 安全监控：检测异常访问
- 合规要求：满足法规要求
- 事故调查：追踪数据访问
- 责任追溯：明确操作责任

### 审计对象

- 数据库对象访问
- 特权操作
- 数据修改
- 用户和权限变更

## 审计配置

### 启用审计

```sql
-- postgresql.conf
-- 启用审计
audit_enabled = on

-- 审计目标类型
-- 1: SELECT
-- 2: INSERT
-- 3: UPDATE
-- 4: DELETE
-- 5: TRUNCATE
-- 6: CREATE
-- 7: DROP
-- 8: ALTER
-- 9: GRANT
-- 10: REVOKE
-- 11: EXECUTE
-- 13: COPY
audit_user_event = 'DDL,DML,SELECT,GRANT,REVOKE,EXECUTE,COPY'
```

### 审计用户

```sql
-- 审计特定用户
audit_user = 'admin_user,dba_user'
```

### 审计数据库

```sql
-- 审计特定数据库
audit_database = 'app_db,finance_db'
```

### 审计表

```sql
-- 审计特定表
audit_table = 'users,orders,credit_cards'
```

## 审计日志分析

### 查看审计日志

```bash
# 审计日志位置
/opt/gaussdb/log/
/opt/gaussdb/data/pg_audit/

# 查看最近的审计日志
tail -100 /opt/gaussdb/log/pg_audit/pg_audit.log
```

### 审计日志格式

```
LOG:
  AUDIT_TYPE: SELECT
  DATABASE: app_db
  SCHEMA: public
  OBJECT: users
  STATEMENT: SELECT * FROM users WHERE id = 1;
  USER: app_user
  CLIENT_IP: 192.168.1.100
  TIMESTAMP: 2024-01-01 10:30:00
```

### 审计日志分析工具

```bash
# 统计访问最多的表
cat /opt/gaussdb/log/pg_audit/pg_audit.log | grep OBJECT | sort | uniq -c | sort -rn

# 统计用户活动
cat /opt/gaussdb/log/pg_audit/pg_audit.log | grep USER | sort | uniq -c | sort -rn

# 查找失败登录
cat /opt/gaussdb/log/pg_audit/pg_audit.log | grep FATAL
```

## 合规监控

### GDPR 合规

**审计要求**:
- 记录所有数据访问
- 审计数据处理操作
- 记录数据删除操作
- 监控异常访问模式

### HIPAA 合规

**审计要求**:
- 记录 PHI（受限健康信息）访问
- 审计修改 PHI 的操作
- 监控异常访问模式
- 定期审计报告

### 等保要求

**审计要求**:
- 记录所有数据库操作
- 特权操作必须审计
- 记录访问失败
- 审计报告定期提交

## 审计告警

### 配置告警

```sql
-- 审计告警阈值
audit_interval = 30
audit_log_format = 'CSV'
audit_log_file = '/opt/gaussdb/log/audit.log'
```

### 监控脚本

```bash
#!/bin/bash
# 审计监控脚本

AUDIT_LOG="/opt/gaussdb/log/audit.log"

# 检查审计日志大小
LOG_SIZE=$(stat -f%s "$AUDIT_LOG")
MAX_SIZE=100000000  # 100MB

if [ $LOG_SIZE -gt $MAX_SIZE ]; then
    echo "Audit log too large: $LOG_SIZE" | mail -s "Audit Alert" admin@example.com
fi

# 检查异常访问模式
# 查找频繁的失败登录
grep "authentication failed" "$AUDIT_LOG" | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10
```

## 审计报告

### 生成审计报告

```sql
-- 用户活动报告
SELECT
    USER,
    count(*) AS activity_count,
    min(TIMESTAMP) AS first_access,
    max(TIMESTAMP) AS last_access
FROM audit_logs
GROUP BY USER
ORDER BY activity_count DESC;
```

```sql
-- 敏感表访问报告
SELECT
    OBJECT,
    count(*) AS access_count,
    count(DISTINCT USER) AS unique_users
FROM audit_logs
WHERE OBJECT IN ('users', 'credit_cards')
GROUP BY OBJECT
ORDER BY access_count DESC;
```

### 合规报告

```sql
-- GDPR 合规报告
SELECT
    DATE_TRUNC('day', TIMESTAMP) AS report_date,
    count(*) AS access_count,
    count(DISTINCT USER) AS unique_users
FROM audit_logs
WHERE OBJECT = 'personal_data'
GROUP BY report_date
ORDER BY report_date;
```

## 性能考虑

### 审计性能影响

- CPU 影响: 1-3%
- I/O 影响: 10-20%
- 存储影响: 日志增长快

### 优化策略

- 只审计必要的操作
- 定期轮转审计日志
- 异步写入审计日志
- 审计日志归档

### 审计日志轮转

```sql
-- postgresql.conf
-- 审计日志轮转
audit_rotation_age = 7d
audit_rotation_size = 100MB
```

## Tips

**审计最佳实践**:
- 审计所有敏感操作
- 定期审查审计日志
- 配置审计告警
- 定期审计报告
- 保护审计日志

**合规监控**:
- 了解法规要求
- 配置相应的审计
- 定期合规检查
- 记录审计证据
- 制定违规响应

**性能优化**:
- 只审计必要操作
- 定期轮转日志
- 异步写入
- 审计日志归档

**企业规范**:
- [ ] 启用全面审计
- [ ] 配置审计告警
- [ ] 定期审计报告
- [ ] 保护审计日志
- [ ] 审计日志归档
- [ ] 定期合规检查
- [ ] 记录审计证据
- [ ] 制定违规响应

## 任务

启用审计:

```sql
-- 启用审计
ALTER SYSTEM SET audit_enabled = on;

-- 配置审计
ALTER SYSTEM SET audit_user_event = 'DDL,DML,SELECT,GRANT,REVOKE,EXECUTE,COPY';

-- 验证配置
SHOW audit_enabled;
SHOW audit_user_event;
```

测试审计:

```sql
-- 执行一些操作生成审计日志
SELECT * FROM users LIMIT 5;
INSERT INTO audit_test (message) VALUES ('test');
UPDATE audit_test SET message = 'updated';
DELETE FROM audit_test;
```

查看审计日志:

```bash
# 查看最新的审计日志
tail -20 /opt/gaussdb/log/audit.log
```

生成用户活动报告:

```sql
-- 模拟审计报告查询
SELECT
    USER,
    count(*) AS activity_count
FROM pg_audit
WHERE STATEMENT LIKE '%users%'
GROUP BY USER
ORDER BY activity_count DESC;
```

检查审计配置:

```sql
-- 查看所有审计配置
SHOW ALL LIKE 'audit%';
```

配置审计日志轮转:

```sql
-- 配置日志轮转
ALTER SYSTEM SET audit_rotation_age = '7d';
ALTER SYSTEM SET audit_rotation_size = '100MB';
```

**自动评分**: 验证审计已启用，审计日志正常生成，告警配置正确。

## 错误演示

未启用审计:

```sql
-- 审计未启用
SHOW audit_enabled;
-- 返回 off
```

说明: 必须启用审计才能监控数据库操作。

审计日志过大:

```bash
# 审计日志未轮转导致磁盘空间不足
du -sh /opt/gaussdb/log/audit/
```

说明: 必须配置审计日志轮转和归档。
