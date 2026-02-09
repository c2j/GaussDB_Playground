# 用户管理和 RBAC

## 角色和用户

### 创建角色

```sql
-- 创建管理员角色
CREATE ROLE admin_role WITH LOGIN PASSWORD 'Admin@2024' SUPERUSER;

-- 创建应用角色
CREATE ROLE app_role WITH NOLOGIN PASSWORD 'App@2024';
```

### 角色继承

```sql
-- 创建角色层次结构
CREATE ROLE dba_role WITH NOLOGIN;
CREATE ROLE developer_role WITH NOLOGIN;
CREATE ROLE reader_role WITH NOLOGIN;

-- 继承权限
GRANT developer_role TO dba_role;
GRANT reader_role TO developer_role;
```

### 角色属性

```sql
-- 查看角色属性
SELECT rolname, rolsuper, rolcreaterole, rolinherit
FROM pg_roles;
```

## 权限管理

### 对象权限

**表权限**:
```sql
-- 授予表级权限
GRANT SELECT, INSERT, UPDATE ON users TO app_role;
```

**架构权限**:
```sql
-- 授予架构权限
GRANT USAGE ON SCHEMA public TO app_role;
```

**数据库权限**:
```sql
-- 授予数据库权限
GRANT CONNECT ON DATABASE app_db TO app_role;
```

### 列权限

```sql
-- 列级权限（行级安全）
CREATE POLICY user_data_policy ON users
FOR SELECT
USING (username)
TO reader_role;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## 用户管理

### 创建用户

```sql
-- 创建普通用户
CREATE USER app_user WITH PASSWORD 'App@2024' IN ROLE app_role;

-- 创建只读用户
CREATE USER reader_user WITH PASSWORD 'Reader@2024' IN ROLE reader_role;

-- 创建开发者用户
CREATE USER developer_user WITH PASSWORD 'Dev@2024' IN ROLE developer_role;
```

### 修改密码

```sql
-- 修改用户密码
ALTER USER app_user WITH PASSWORD 'NewApp@2024';
```

### 禁用/启用用户

```sql
-- 禁用用户
ALTER USER app_user NOLOGIN;

-- 启用用户
ALTER USER app_user WITH LOGIN;
```

### 删除用户

```sql
-- 删除用户
DROP USER app_user;

-- 级联删除角色和权限
DROP USER app_user CASCADE;
```

## 最小权限原则

### 实施策略

1. **应用账户**:
   - 只读账户: SELECT 权限
   - 写入账户: INSERT, UPDATE, DELETE
   - 管理账户: DDL, DML 权限

2. **开发环境**:
   - 开发人员: 开发数据库完全权限
   - 测试人员: 只读权限

3. **生产环境**:
   - 应用账户: 最小必要权限
   - DBA 管理员: 管理权限
   - 审计账户: 只读审计权限

## RBAC（基于角色的访问控制）

### RBAC 模型

```
┌──────────────┐
│   角色 (RBAC) │
└──────────────┘
       │
       │ 继承
       ▼
┌─────────────────────────┐
│   权限 (Privileges)  │
└─────────────────────────┘
       │
       │ 授予
       ▼
┌──────────────────────┐
│   用户 (Users)     │
└──────────────────────┘
```

### RBAC 优势

- **简化管理**: 通过角色管理权限
- **一致性**: 相同角色的用户有相同权限
- **灵活性**: 易于添加/撤销权限
- **可维护**: 权限变更通过角色

## 权限审计

### 查看权限

```sql
-- 查看用户角色
SELECT
    usename,
    rolname
FROM pg_user
JOIN pg_roles ON pg_user.usesysid = pg_roles.oid;
```

```sql
-- 查看表权限
SELECT
    grantee,
    grantor,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges;
```

### 权限变更监控

- 记录所有权限授予和撤销
- 审计敏感权限变更
- 定期审查用户权限
- 撤销离职员工权限

## Tips

**用户管理最佳实践**:
- 最小权限原则
- 角色层次管理
- 定期权限审计
- 及时撤销不必要权限
- 使用强密码策略
- 定期更换密码

**RBAC 最佳实践**:
- 设计合理的角色层次
- 角色职责明确
- 权限授予通过角色
- 定期审查角色配置
- 文档化角色权限

**企业规范**:
- [ ] 制定用户和角色策略
- [ ] 实施最小权限原则
- [ ] 使用 RBAC 管理权限
- [ ] 定期权限审计
- [ ] 及时撤销离职员工权限
- [ ] 强密码策略
- [ ] 定期更换密码
- [ ] 记录权限变更

## 任务

创建角色层次:

```sql
-- 创建基础角色
CREATE ROLE dba_role WITH NOLOGIN;
CREATE ROLE developer_role WITH NOLOGIN;
CREATE ROLE reader_role WITH NOLOGIN;

-- 创建应用角色
CREATE ROLE app_read_role WITH NOLOGIN IN ROLE reader_role;
CREATE ROLE app_write_role WITH NOLOGIN IN ROLE developer_role;
```

创建用户并分配角色:

```sql
-- 创建应用读用户
CREATE USER app_read_user WITH PASSWORD 'Read@2024' IN ROLE app_read_role;

-- 创建应用写用户
CREATE USER app_write_user WITH PASSWORD 'Write@2024' IN ROLE app_write_role;

-- 创建管理员用户
CREATE USER admin_user WITH PASSWORD 'Admin@2024' IN ROLE dba_role WITH SUPERUSER;
```

授予权限:

```sql
-- 授予读权限
GRANT USAGE ON SCHEMA public TO app_read_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read_role;

-- 授予写权限
GRANT USAGE ON SCHEMA public TO app_write_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_write_role;
```

查看用户和角色:

```sql
-- 查看用户和对应角色
SELECT
    u.usename,
    r.rolname
FROM pg_user u
JOIN pg_auth_members m ON u.usesysid = m.member
JOIN pg_roles r ON m.roleid = r.oid
ORDER BY u.usename;
```

查看角色权限:

```sql
-- 查看 dba_role 的权限
SELECT * FROM information_schema.role_table_grants
WHERE grantee = 'dba_role';
```

测试权限:

```sql
-- 以读用户登录测试
SET ROLE app_read_role;
SELECT * FROM users LIMIT 5;

-- 尝试插入数据（应该失败）
INSERT INTO users (username, email) VALUES ('test', 'test@example.com');
```

修改用户密码:

```sql
-- 更换密码
ALTER USER app_write_user WITH PASSWORD 'NewWrite@2024';
```

## 错误演示

权限过大:

```sql
-- 授予过多权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_role;

-- 普通应用用户可以删除表
DROP TABLE users;
```

说明: 不要授予不必要的权限，遵循最小权限原则。

未继承角色权限:

```sql
-- 创建新用户但未继承角色
CREATE USER new_user WITH PASSWORD 'New@2024';

-- 新用户没有任何权限
SELECT * FROM users;
```

说明: 新创建的用户需要显式授予权限或分配到角色。
