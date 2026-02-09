# 数据加密

## 加密类型

### 传输加密（TLS/SSL）

**作用**: 加密客户端和服务器之间的数据传输

**配置**:
```sql
-- postgresql.conf
ssl = on
ssl_cert_file = '/opt/gaussdb/cert/server.crt'
ssl_key_file = '/opt/gaussdb/cert/server.key'
ssl_ca_file = '/opt/gaussdb/cert/ca.crt'
```

**客户端连接**:
```bash
# 使用 SSL 连接
gsql "host=localhost port=5432 dbname=postgres sslmode=require"
```

### 存储加密（TDE）

**作用**: 加密数据库文件存储

**特点**:
- 透明加密
- 应用无需修改
- 性能影响较小

**限制**:
- GaussDB 可能不完全支持 TDE
- 需要特定配置

## 列级加密

### 创建加密列

```sql
-- 创建加密列
CREATE TABLE credit_cards (
    id SERIAL PRIMARY KEY,
    card_number VARCHAR(20),
    card_holder VARCHAR(100),
    expiry_date DATE
);

-- 使用 pgcrypto 加密
-- 需要先安装 pgcrypto 扩展
CREATE EXTENSION pgcrypto;

-- 创建加密视图或使用加密函数
CREATE VIEW encrypted_cards AS
SELECT
    id,
    encrypt(card_number, 'encryption_key', 'aes') AS encrypted_card_number,
    card_holder,
    expiry_date
FROM credit_cards;
```

### 解密数据

```sql
-- 解密数据
SELECT
    id,
    decrypt(encrypted_card_number::bytea, 'encryption_key', 'aes') AS card_number,
    card_holder,
    expiry_date
FROM encrypted_cards;
```

## 密钥管理

### 密钥安全

**存储安全**:
- 密钥文件权限: 600
- 密钥文件所有者: root 或数据库用户
- 密钥备份到安全位置
- 密钥轮换策略

**密钥轮换**:
```sql
-- 定期更换加密密钥
-- 需要重新加密所有数据
```

### 密钥备份

**备份策略**:
- 密钥分开备份
- 密钥备份到安全位置
- 多个备份副本
- 定期测试密钥恢复

## SSL/TLS 配置

### 生成证书

```bash
# 生成 CA 证书
openssl req -new -x509 -days 365 -keyout CA_private_key.pem -out CA_cert.pem

# 生成服务器证书
openssl req -new -keyout server_key.pem -out server_req.pem -days 365
openssl x509 -req -in server_req.pem -CA CA_cert.pem -CAkey CA_private_key.pem -CAcreateserial -out server_cert.pem
```

### 配置 PostgreSQL

```sql
-- postgresql.conf
ssl = on
ssl_cert_file = '/opt/gaussdb/cert/server_cert.pem'
ssl_key_file = '/opt/gaussdb/cert/server_key.pem'
ssl_ca_file = '/opt/gaussdb/cert/CA_cert.pem'
```

### 配置 pg_hba.conf

```
# 只允许 SSL 连接
hostssl    all      all       0.0.0.0/0   reject
hostssl    all      all       0.0.0.0/0   md5
```

## 数据脱敏

### 脱敏技术

**部分脱敏**:
- 邮箱: user@example.com -> u***@example.com
- 手机号: 13800138000 -> 138****8000
- 身份证: 110101199001010101 -> 110**********1010101

**哈希脱敏**:
- 使用不可逆哈希算法
- SHA-256, bcrypt
- 适用于密码验证

**加密脱敏**:
- 使用可逆加密
- 适用于需要还原的场景

### 脱敏函数

```sql
-- 创建脱敏函数
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN
        CASE
            WHEN email ~ '^(.+)@(.+)$'
            THEN regexp_replace(email, '^(.{2}).*(@.+)$', '\1***\2')
            ELSE email
        END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 使用脱敏函数
SELECT
    username,
    mask_email(email) AS masked_email
FROM users;
```

## 合规要求

### 加密要求

**GDPR 要求**:
- 数据传输和存储加密
- 密钥管理和保护
- 加密算法符合标准
- 定期安全评估

**HIPAA 要求**:
- 传输加密（TLS 1.2+）
- 存储加密（AES-256）
- 访问控制和审计
- 加密密钥管理

### 审计要求

- 记录所有加密操作
- 审计密钥访问
- 监控加密性能
- 定期安全评估

## 性能考虑

### 加密性能影响

- **传输加密**: 网络延迟增加 5-10%
- **存储加密**: I/O 性能降低 10-20%
- **查询性能**: 解密操作增加查询时间

### 优化策略

- 合理选择加密算法
- 使用硬件加速
- 优化密钥长度
- 缓存常用数据

## Tips

**加密最佳实践**:
- 启用传输加密（TLS/SSL）
- 敏感数据必须加密
- 安全管理密钥
- 定期轮换密钥
- 测试密钥恢复
- 备份加密密钥

**脱敏最佳实践**:
- 生产环境使用脱敏
- 开发环境使用真实数据
- 脱敏规则一致
- 记录脱敏规则
- 定期审查脱敏效果

**密钥管理最佳实践**:
- 密钥和数据库分开存储
- 使用强密钥保护
- 定期轮换密钥
- 多地备份密钥
- 限制密钥访问

**企业规范**:
- [ ] 启用传输加密
- [ ] 敏感数据加密
- [ ] 安全管理密钥
- [ ] 定期轮换密钥
- [ ] 备份加密密钥
- [ ] 实施数据脱敏
- [ ] 符合合规要求
- [ ] 定期安全评估

## 任务

配置传输加密:

```sql
-- 查看当前 SSL 配置
SHOW ssl;
SHOW ssl_cert_file;
SHOW ssl_key_file;
```

测试 SSL 连接:

```bash
# 使用 SSL 模式连接
gsql "host=localhost port=5432 dbname=postgres sslmode=require"
```

创建加密列:

```sql
-- 创建包含敏感信息的表
CREATE TABLE sensitive_data (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(50),
    sensitive_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试数据
INSERT INTO sensitive_data (data_type, sensitive_value)
VALUES
    ('credit_card', '4111111111111111'),
    ('ssn', '123-45-6789');
```

创建脱敏函数:

```sql
-- 创建信用卡脱敏函数
CREATE OR REPLACE FUNCTION mask_credit_card(card_number TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN
        CASE
            WHEN length(card_number) = 16 THEN
                regexp_replace(card_number, '(.{4})(.*)(.{4})', '\1****\3')
            WHEN length(card_number) = 19 THEN
                regexp_replace(card_number, '(.{4})(.*)(.{4})', '\1****\3')
            ELSE card_number
        END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

测试脱敏:

```sql
SELECT
    data_type,
    mask_credit_card(sensitive_value) AS masked_value
FROM sensitive_data;
```

查看加密配置:

```sql
-- 查看配置文件位置
SHOW config_file;
```

**自动评分**: 验证加密配置正确，脱敏函数正常工作，敏感数据得到保护。

## 错误演示

未使用 SSL 连接:

```bash
-- 不加密的连接
gsql "host=localhost port=5432 dbname=postgres"

-- 数据可能被窃听
```

说明: 生产环境必须使用 SSL 加密连接。

密钥泄露:

```bash
-- 密钥文件权限不安全
ls -l /opt/gaussdb/cert/server_key.pem

# 如果权限是 644，不安全
```

说明: 密钥文件权限应该是 600，只有所有者可读写。
