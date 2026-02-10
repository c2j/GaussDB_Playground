# 行级安全

## RLS（Row Level Security）概述

### 定义

RLS 允许在行级别控制数据访问，不同用户可以访问表中的不同行。

### 应用场景

- 多租户应用：每个用户只能访问自己的数据
- 部门数据：每个部门只能访问自己的数据
- 敏感数据：根据安全级别控制数据访问
- 地理数据：根据地理位置控制访问

## 启用 RLS

### 创建策略

```sql
-- 创建策略（默认拒绝访问）
CREATE POLICY user_data_policy ON users
FOR ALL
TO PUBLIC
USING (true);
```

### 启用 RLS

```sql
-- 启用表级 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## 策略类型

### 策略表达式

**比较操作符**:
- `=`: 等于
- `<>` 或 `!=`: 不等于
- `<` 和 `<=`: 小于
- `>` 和 `>=`: 大于
- `IN`: 在列表中
- `LIKE`: 匹配模式
- `BETWEEN`: 在范围内

**逻辑操作符**:
- `AND`: 与
- `OR`: 或
- `NOT`: 非

### 示例策略

```sql
-- 用户只能访问自己的数据
CREATE POLICY user_data_policy ON users
FOR ALL
TO app_role
USING (username = current_user);
```

## 不同策略类型

### SELECT 策略

```sql
-- 只读用户只能查询
CREATE POLICY read_only_policy ON orders
FOR SELECT
TO reader_role
USING (status = 'completed');

-- 只读用户不能修改数据
CREATE POLICY no_write_policy ON orders
FOR INSERT, UPDATE, DELETE
TO reader_role
USING (false);
```

### 插入策略

```sql
-- 只能插入自己的订单
CREATE POLICY user_orders_policy ON orders
FOR INSERT
TO app_role
USING (user_id = current_user_id);
```

### 更新策略

```sql
-- 只能更新自己的订单（未完成）
CREATE POLICY update_user_orders_policy ON orders
FOR UPDATE
TO app_role
USING (user_id = current_user_id AND status = 'pending');
```

### 删除策略

```sql
-- 只有管理员可以删除
CREATE POLICY admin_delete_policy ON users
FOR DELETE
TO admin_role
WITH CHECK (true);

-- 普通用户不能删除
CREATE POLICY no_delete_policy ON users
FOR DELETE
TO app_role
USING (false);
```

## 基于角色的策略

### 为不同角色创建策略

```sql
-- 管理员策略（完全访问）
CREATE POLICY admin_all_policy ON users
FOR ALL
TO admin_role
USING (true);

-- 开发者策略（读写访问）
CREATE POLICY developer_policy ON users
FOR ALL
TO developer_role
USING (username = current_user OR department = 'development');

-- 读用户策略（只读访问）
CREATE POLICY reader_policy ON users
FOR SELECT
TO reader_role
USING (true);
```

### 角色继承

```sql
-- 创建基础角色
CREATE ROLE base_role WITH NOLOGIN;
CREATE ROLE reader_role WITH NOLOGIN IN ROLE base_role;
CREATE ROLE writer_role WITH NOLOGIN IN ROLE base_role;

-- 为基础角色创建策略
CREATE POLICY base_role_policy ON users
FOR ALL
TO base_role
USING (department = 'finance');
```

## Bypass RLS

### 超级用户绕过

```sql
-- 超级用户可以绕过 RLS
ALTER POLICY user_data_policy ON users TO admin_role USING (true) WITH CHECK (true);
```

### 表所有者绕过

```sql
-- 表所有者可以绕过 RLS（默认）
-- 这是默认行为，不需要特别配置
```

## 数据脱敏

### 创建脱敏视图

```sql
-- 创建脱敏视图（隐藏敏感信息）
CREATE VIEW user_masked AS
SELECT
    id,
    username,
    LEFT(email, POSITION('@', email)) AS email_name,
    LEFT(phone, 3, 4) AS masked_phone,
    country
FROM users;
```

### 使用脱敏函数

```sql
-- 创建脱敏函数
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN
        CASE
            WHEN email ~ '^(.+)@(.+)$'
            THEN regexp_replace(email, '(.+)(@.+)', '\1***\2')
            ELSE email
        END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

```sql
-- 使用脱敏函数
SELECT
    username,
    mask_email(email) AS masked_email
FROM users;
```

## 性能考虑

### RLS 性能影响

- 查询计划可能更复杂
- 每行都需要评估策略
- 可能增加查询延迟

### 优化策略

```sql
-- 使用函数索引
CREATE INDEX idx_users_username ON users(username);

-- 避免复杂的策略表达式
CREATE POLICY simple_policy ON users
FOR SELECT
TO app_role
USING (user_id = current_user_id);
```

## Tips

**RLS 最佳实践**:
- 策略简单清晰
- 为常用查询创建索引
- 测试策略性能影响
- 使用数据库角色管理
- 定期审查和更新策略

**数据脱敏最佳实践**:
- 生产环境使用脱敏
- 开发环境使用真实数据
- 脱敏规则一致
- 测试脱敏数据可用性
- 记录脱敏规则

**安全考虑**:
- 确保策略正确
- 定期审计 RLS 配置
- 监控异常访问模式
- 记录策略变更

**企业规范**:
- [ ] 实施 RLS 保护敏感数据
- [ ] 配置基于角色的策略
- [ ] 使用数据脱敏
- [ ] 测试 RLS 性能
- [ ] 定期审查策略
- [ ] 监控异常访问
- [ ] 记录策略变更

## 任务

创建多租户应用表:

```sql
CREATE TABLE multi_tenant_data (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    user_id INT,
    sensitive_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

插入测试数据:

```sql
INSERT INTO multi_tenant_data (tenant_id, user_id, sensitive_data)
VALUES
    (1, 101, 'Tenant 1 sensitive data'),
    (1, 102, 'Tenant 1 more data'),
    (2, 201, 'Tenant 2 data'),
    (2, 202, 'Tenant 2 more data');
```

启用 RLS:

```sql
-- 启用 RLS
ALTER TABLE multi_tenant_data ENABLE ROW LEVEL SECURITY;
```

创建租户策略:

```sql
-- 租户只能访问自己的数据
CREATE POLICY tenant_isolation_policy ON multi_tenant_data
FOR ALL
TO app_role
USING (tenant_id = current_tenant_id());
```

测试 RLS:

```sql
-- 设置当前租户 ID
SET current_tenant_id = 1;

-- 查看数据（应该只返回租户 1 的数据）
SELECT * FROM multi_tenant_data;

-- 设置为租户 2
SET current_tenant_id = 2;

-- 查看数据（应该只返回租户 2 的数据）
SELECT * FROM multi_tenant_data;
```

创建脱敏视图:

```sql
-- 创建脱敏函数
CREATE OR REPLACE FUNCTION mask_sensitive(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN
        CASE
            WHEN length(data) <= 4 THEN '****'
            WHEN length(data) <= 8 THEN '****-****'
            ELSE regexp_replace(data, '(.{4})(.*)(.{4})', '\1****\3****\5')
        END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

```sql
-- 创建脱敏视图
CREATE VIEW multi_tenant_data_masked AS
SELECT
    id,
    tenant_id,
    user_id,
    mask_sensitive(sensitive_data) AS masked_data,
    created_at
FROM multi_tenant_data;
```

测试数据脱敏:

```sql
-- 查看脱敏后的数据
SELECT * FROM multi_tenant_data_masked;
```

查看当前策略:

```sql
-- 查看表的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'multi_tenant_data';
```

**自动评分**: 验证 RLS 策略正确工作，用户只能访问自己的数据，脱敏函数正常。

## 错误演示

策略允许所有访问:

```sql
-- 错误的策略：所有用户可以访问所有数据
CREATE POLICY all_access_policy ON multi_tenant_data
FOR ALL
TO app_role
USING (true);
```

说明: 策略过于宽松，失去了 RLS 的意义。

策略过于复杂:

```sql
-- 复杂的策略可能导致性能问题
CREATE POLICY complex_policy ON multi_tenant_data
FOR ALL
TO app_role
USING (
    tenant_id = current_tenant_id()
    AND
    (
        user_id = current_user_id()
        OR
        created_at > CURRENT_DATE - INTERVAL '30 days'
    )
    AND
    (
        CASE
            WHEN extract(DOW FROM created_at) IN (0, 6) THEN true
            ELSE false
        END
    )
);
```

说明: 策略过于复杂可能导致查询性能下降。
