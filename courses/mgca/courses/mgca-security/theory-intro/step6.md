# 安全加固

## 系统级安全

### 操作系统安全

**文件权限**:
```bash
# 检查和设置文件权限
chmod 700 /opt/gaussdb/data
chmod 600 /opt/gaussdb/data/*.conf
```

**用户和组**:
```bash
# 数据库用户应该是 omm
ls -ld /opt/gaussdb/data

# 确保只有数据库用户有权限
chown -R omm:dbgrp /opt/gaussdb/data
```

**防火墙配置**:
```bash
# 只允许必要的端口
# 数据库端口: 5432
# 应用端口: 5433, 5434
```

### 网络安全

**网络隔离**:
- 数据库服务器放在 DMZ（非军事化区）
- 应用服务器放在应用区
- 只开放必要的端口和协议

**VPN 访问**:
- 远程管理使用 VPN
- 避免数据库直接暴露在公网
- 使用密钥认证

### SSL/TLS 加密

**启用 SSL**:
```sql
-- postgresql.conf
ssl = on
ssl_cert_file = '/opt/gaussdb/cert/server.crt'
ssl_key_file = '/opt/gaussdb/cert/server.key'
ssl_ca_file = '/opt/gaussdb/cert/ca.crt'
```

**强制 SSL**:
```sql
-- pg_hba.conf
hostssl    all      all       all       0.0.0.0/0   md5
```

## 数据库配置安全

### 默认安全配置

```sql
-- 禁用危险功能
ALTER SYSTEM SET allow_system_table_mods = off;

-- 禁用外部表
ALTER SYSTEM SET allow_system_table_mods = off;

-- 禁用用户定义函数（生产环境）
ALTER SYSTEM SET allow_system_table_mods = off;
```

### 连接安全

```sql
-- pg_hba.conf
-- 拒绝所有连接
host    all      all       0.0.0.0/0   reject

-- 只允许本地连接
host    all      all       127.0.0.1/32  trust

-- 允许特定 IP 的 SSL 连接
host    all      all       192.168.1.0/24   md5
host    all      all       192.168.2.0/24   md5
```

### 用户和权限

```sql
-- 移除默认的 postgres 用户
DROP USER postgres;

-- 移除默认的 template1 数据库
DROP DATABASE template1;

-- 只保留必要的扩展
-- SELECT * FROM pg_extension;
```

## 密码安全

### 密码策略

**强密码要求**:
- 最小长度: 12 字符
- 包含: 大写字母、小写字母、数字、特殊字符
- 定期更换密码（90-180 天）

**密码验证**:
```sql
-- 使用密码验证插件（如果可用）
-- CREATE EXTENSION passwordcheck;

-- 或者使用 pgcrypto 验证密码
SELECT crypt('password', 'salt') = crypt('entered_password', salt);
```

### 密码管理

```sql
-- 设置密码有效期（如果支持）
ALTER USER app_user WITH VALID UNTIL '2024-12-31';
```

## 禁用危险功能

### 禁用 EXECUTE

```sql
-- 禁用 EXECUTE 执行任意命令
-- 如果需要，只允许特定用户
```

### 限制文件系统访问

```sql
-- 禁止访问文件系统
-- allow_system_table_mods = off
```

### 限制超级用户

```sql
-- 只在必要时授予 SUPERUSER 权限
-- 定期审查拥有 SUPERUSER 的用户
SELECT rolname FROM pg_roles WHERE rolsuper;
```

## 监控和告警

### 安全监控

- 异常登录监控
- 权限变更监控
- 数据访问监控
- 性能异常监控

### 告警配置

```bash
#!/bin/bash
# 安全监控脚本

# 检查失败的登录尝试
FAILED_LOGINS=$(grep "authentication failed" /opt/gaussdb/log/postgresql-*.log | wc -l)

if [ $FAILED_LOGINS -gt 10 ]; then
    echo "Multiple failed logins detected: $FAILED_LOGINS"
    # 发送告警
    # echo "Security alert" | mail -s "Security Alert" admin@example.com
fi

# 检查超级用户创建
SUPER_USERS=$(psql -t -c "SELECT count(*) FROM pg_roles WHERE rolsuper")

if [ $SUPER_USERS -gt 3 ]; then
    echo "Too many superusers: $SUPER_USERS"
    # 发送告警
fi
```

## 定期安全审计

### 安全检查清单

- [ ] 检查文件权限
- [ ] 检查用户和角色
- [ ] 检查权限分配
- [ ] 检查审计日志
- [ ] 检查 SSL 配置
- [ ] 检查密码策略
- [ ] 检查危险功能
- [ ] 检查网络配置

### 审计报告

```sql
-- 用户活动报告
SELECT
    USER,
    count(*) AS activity_count,
    min(TIMESTAMP) AS first_activity,
    max(TIMESTAMP) AS last_activity
FROM audit_logs
WHERE TIMESTAMP > CURRENT_DATE - INTERVAL '30 days'
GROUP BY USER
ORDER BY activity_count DESC;
```

```sql
-- 权限变更报告
SELECT *
FROM audit_logs
WHERE OPERATION IN ('GRANT', 'REVOKE')
ORDER BY TIMESTAMP DESC
LIMIT 100;
```

## 安全更新

### 定期更新

- 安全补丁更新
- 密钥轮换
- 证书更新
- 配置更新
- 安全策略更新

### 漏洞扫描

- 定期进行漏洞扫描
- 修复已知漏洞
- 关注安全公告
- 进行渗透测试

## Tips

**安全加固最佳实践**:
- 最小权限原则
- 定期安全审计
- 启用所有安全功能
- 保持系统更新
- 监控和告警
- 制定应急响应计划

**分层安全**:
- 网络层安全
- 应用层安全
- 数据库层安全
- 数据层安全（加密、脱敏）

**企业规范**:
- [ ] 制定安全策略
- [ ] 定期安全审计
- [ ] 启用所有安全功能
- [ ] 保持系统更新
- [ ] 配置监控告警
- [ ] 制定应急响应计划
- [ ] 定期安全培训
- [ ] 进行安全演练

## 任务

检查系统安全配置:

```bash
# 检查文件权限
ls -ld /opt/gaussdb/data

# 检查用户
id omm

# 检查防火墙
iptables -L -n | grep 5432
```

检查数据库安全配置:

```sql
-- 检查危险功能
SHOW allow_system_table_mods;

-- 检查超级用户
SELECT rolname FROM pg_roles WHERE rolsuper;

-- 检查权限过大的用户
SELECT
    usename,
    usecreatedb,
    useuperm
FROM pg_user
WHERE usecreatedb = 'yes';
```

检查审计配置:

```sql
SHOW audit_enabled;
SHOW audit_user_event;
```

检查 SSL 配置:

```sql
SHOW ssl;
SHOW ssl_cert_file;
```

检查用户密码:

```sql
-- 查看用户（密码不显示）
SELECT usename, usecreatedb FROM pg_user;
```

实施安全加固:

```sql
-- 禁用危险功能
ALTER SYSTEM SET allow_system_table_mods = off;

-- 配置连接安全
-- 更新 pg_hba.conf

-- 验证配置
SHOW allow_system_table_mods;
```

安全监控脚本:

```bash
#!/bin/bash
# 安全监控脚本

# 检查失败登录
FAILED_ATTEMPTS=$(grep "authentication failed" /opt/gaussdb/log/postgresql-*.log | wc -l)

if [ $FAILED_ATTEMPTS -gt 5 ]; then
    echo "Warning: Multiple failed login attempts: $FAILED_ATTEMPTS"
fi

# 检查超级用户数量
SUPER_COUNT=$(psql -t -c "SELECT count(*) FROM pg_roles WHERE rolsuper")

if [ $SUPER_COUNT -gt 2 ]; then
    echo "Warning: Too many superusers: $SUPER_COUNT"
fi

# 检查审计日志大小
LOG_SIZE=$(du -sh /opt/gaussdb/log/ 2>/dev/null)

if [ $LOG_SIZE -gt 1000000 ]; then
    echo "Warning: Audit log is large: $LOG_SIZE"
fi
```

**自动评分**: 验证安全配置合理，监控脚本正常，安全加固有效。

## 错误演示

权限过大:

```sql
-- 授予过多权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_role;

-- 普通应用用户可以删除表
DROP TABLE users;
```

说明: 不要授予不必要的权限，遵循最小权限原则。

未启用审计:

```sql
-- 审计未启用
SHOW audit_enabled;
-- 返回 off
```

说明: 生产环境必须启用审计才能监控安全事件。

数据库暴露在公网:

```bash
-- 数据库端口开放到公网
netstat -tulnp | grep 5432

# 可以看到 0.0.0.0:5432
```

说明: 数据库不应该直接暴露在公网，应该使用 VPN 或应用服务器代理。
