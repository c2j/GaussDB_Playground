### 安全管理与权限控制

企业级安全是openGauss的重要特性，包括访问控制、数据加密、审计日志等。

#### 1. 权限管理

创建角色：
[[create role banking_admin with password 'Admin123!';]]{{RUN}}
[[create role banking_reader with password 'Reader123!';]]{{RUN}}

授予角色权限：
[[grant select on transactions to banking_reader;]]{{RUN}}
[[grant all on transactions to banking_admin;]]{{RUN}}

#### 2. 行级访问控制（RLS）

创建行级安全策略：
[[create table accounts (id int, owner varchar(50), balance decimal);]]{{RUN}}
[[alter table accounts enable row level security;]]{{RUN}}
[[create policy user_own_policy on accounts for select using (owner = current_user);]]{{RUN}}

测试行级权限：
[[set role banking_reader;]]{{RUN}}
[[select * from accounts;]]{{RUN}}

#### 3. 数据加密

创建加密表（需要pgcrypto扩展）：
[[create extension pgcrypto;]]{{RUN}}
[[create table sensitive_data (id int, encrypted_data bytea);]]{{RUN}}

加密数据：
[[insert into sensitive_data values (1, encrypt('Secret123', 'mykey', 'aes'));]]{{RUN}}

解密数据：
[[select decrypt(encrypted_data, 'mykey', 'aes')::varchar from sensitive_data;]]{{RUN}}

#### 4. 错误演示：权限不足

尝试未授权操作：
[[drop table accounts;]]{{RUN}}

错误：权限不足，因为只有所有者可以删除表。这是预期的安全行为。

#### 金融合规要求

银行系统必须满足：
- **最小权限原则**: 用户只拥有必要的最小权限
- **职责分离**: 不同角色职责分离
- **审计日志**: 记录所有敏感操作
- **加密传输**: 使用SSL/TLS加密网络连接

#### 规范CheckList**:
- [ ] 掌握角色和权限的创建方法
- [ ] 理解行级访问控制的应用
- [ ] 掌握数据加密和解密方法
- [ ] 了解金融合规的安全要求
- [ ] 能够设计安全的数据访问方案

[验证结果]：自评你的答案是否覆盖关键点。
