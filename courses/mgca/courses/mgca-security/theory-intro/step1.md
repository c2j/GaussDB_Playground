# 安全基础和威胁模型

## 数据库安全威胁

### SQL 注入

**定义**: 恶意 SQL 代码注入到查询中

**示例**:
```sql
-- 不安全的查询
SELECT * FROM users WHERE username = '$username';

-- 注入示例: ' OR '1'='1'
-- 结果: SELECT * FROM users WHERE username = '' OR '1'='1'
-- 返回所有用户
```

**防护**:
- 使用参数化查询
- 输入验证和清理
- 使用存储过程
- 最小权限原则

### 越权攻击

**定义**: 用户获得超出其权限的访问

**示例**:
- 普通用户获得管理员权限
- 应用账户获得数据库访问
- 通过漏洞提权

**防护**:
- 严格的访问控制
- 最小权限原则
- 定期权限审计
- 及时撤销离职员工权限

### 数据泄露

**定义**: 未授权访问敏感数据

**示例**:
- 备份数据泄露
- 未加密的数据传输
- 缺乏访问控制

**防护**:
- 数据加密
- 访问控制
- 审计日志
- 网络安全

### 拒绝服务

**定义**: 消耗数据库资源导致服务不可用

**示例**:
- 大量查询请求
- 复杂的联合查询
- 事务资源耗尽

**防护**:
- 连接数限制
- 查询超时设置
- 资源限制
- 限流和熔断

## 安全策略

### 最小权限原则

**定义**: 用户只拥有完成工作所需的最小权限

**实施**:
- 应用账户只能访问必要的表
- 只读账户不能执行 DDL/DML
- 定期审查和撤销不必要权限

### 深度防御

**定义**: 多层安全防护

**实施**:
- 网络层防火墙
- 应用层输入验证
- 数据库层访问控制
- 数据层加密

### 责任分离

**定义**: 管理员和开发人员职责分离

**实施**:
- DBA 负责数据库管理
- 开发人员负责应用开发
- 审计员负责安全审计

## 合规要求

### GDPR（欧盟通用数据保护条例）

**核心要求**:
- 数据最小化收集
- 用户数据删除权（被遗忘权）
- 数据可携性
- 数据保护影响评估
- 数据泄露通知

### HIPAA（健康保险便携性和责任法案）

**核心要求**:
- 受限健康信息（PHI）保护
- 访问控制和审计
- 数据加密
- 业务连续性计划
- 安全评估和审计

### 等保要求（网络安全等级保护）

**核心要求**:
- 不同的安全等级要求
- 等级认证
- 安全审计
- 数据加密和备份
- 安全事件报告

## 安全配置

### 默认安全配置

```sql
-- 默认拒绝所有连接
-- pg_hba.conf
# TYPE  DATABASE  USER      ADDRESS         METHOD
host    all      all       0.0.0.0/0   reject

-- 只允许本地连接
host    all      all       127.0.0.1/32  trust
```

### 禁用危险功能

```sql
-- 禁用危险函数
-- postgresql.conf
allow_system_table_mods = off
```

### 连接安全

```sql
-- SSL 加密连接
-- postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

## 监控和告警

### 安全监控

- 异常登录监控
- 权限变更监控
- 数据访问监控
- 异常查询监控

### 告警配置

- 失败登录告警
- 权限提升告警
- 数据删除告警
- 异常流量告警

## Tips

**安全最佳实践**:
- 最小权限原则
- 定期安全审计
- 数据加密存储和传输
- 启用审计日志
- 定期更新安全补丁
- 制定安全应急预案

**威胁防护**:
- SQL 注入: 参数化查询
- 越权攻击: 严格的访问控制
- 数据泄露: 加密和访问控制
- DoS 攻击: 连接限制和资源控制

**企业规范**:
- [ ] 制定安全策略
- [ ] 实施最小权限原则
- [ ] 启用审计日志
- [ ] 定期安全审计
- [ ] 数据加密
- [ ] 员警和监控
- [ ] 制定应急预案
- [ ] 定期安全培训

## 任务

查看当前用户权限:

```sql
SELECT
    usename,
    usecreatedb,
    useuperm,
    usecatupd
FROM pg_user
ORDER BY usename;
```

查看角色权限:

```sql
SELECT
    rolname,
    rolsuper,
    rolcreaterole,
    rolinherit,
    rolcanlogin
FROM pg_roles
ORDER BY rolname;
```

查看表权限:

```sql
SELECT
    grantee,
    grantor,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
ORDER BY table_schema, table_name;
```

检查危险函数:

```sql
-- 检查系统表修改权限
SHOW allow_system_table_mods;
```

查看审计配置:

```sql
SHOW audit_enabled;
```

## 错误演示

SQL 注入示例:

```sql
-- 不安全的查询
SELECT * FROM users WHERE username = '$username';

-- 注入: ' OR '1'='1
-- 结果: 返回所有用户数据
```

说明: 永远不要拼接 SQL 字符串，使用参数化查询。

超权用户示例:

```sql
-- 普通用户被授予管理员权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO normal_user;

-- 正常用户现在可以删除表
DROP TABLE users;
```

说明: 不要授予不必要的权限，遵循最小权限原则。
