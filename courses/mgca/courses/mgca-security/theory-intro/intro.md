## 学习目标

本章节将帮助您掌握 GaussDB 的安全配置和合规管理，确保数据安全和符合法规要求。

**学完本章，您将能够：**
- 理解数据库安全威胁模型和防护策略
- 掌握用户管理和基于角色的访问控制（RBAC）
- 配置数据加密（静态和传输）
- 实施审计日志和合规监控
- 了解行级安全（RLS）和数据脱敏
- 掌握数据库安全加固最佳实践

## 业务场景

**医疗系统合规要求**

某医疗机构需要处理患者敏感信息：
- 遵循 HIPAA（健康保险便携性和责任法案）
- 患者数据必须加密存储和传输
- 所有数据访问必须审计
- 必须实现最小权限原则
- 定期进行安全合规审计

DBA 团队需要：
1. 实施数据加密保护患者信息
2. 配置细粒度访问控制
3. 启用全面的审计日志
4. 实现数据脱敏保护敏感信息
5. 制定安全策略和应急预案

通过本章学习，您将能够：
- 实施端到端的数据加密
- 配置基于角色的访问控制
- 启用全面的审计监控
- 实现行级数据保护
- 确保符合合规要求

**政府机构案例：GDPR 和审计要求**

某政府机构需要处理公民个人数据，必须遵守欧盟 GDPR（通用数据保护条例）的要求：

**法规核心要求**:
- **数据最小化收集**：只收集业务必需的最少数据
- **用户知情同意**：获取明确的用户同意数据处理目的和方式
- **数据删除权（被遗忘权）**：用户可以要求删除其所有个人数据
- **数据可携性**：用户可以请求以结构化格式导出其数据
- **数据保护影响评估**：评估数据处理对个人隐私的影响
- **数据泄露通知**：发生数据泄露时及时通知监管机构和受影响用户
- **数据保护官**：任命数据保护官（DPO）负责合规

**数据库实现**:
1. **数据分类和标记**：
   ```sql
   -- 创建表时添加数据敏感性分类
   CREATE TABLE citizens (
       id BIGINT PRIMARY KEY,
       name VARCHAR(100),
       email VARCHAR(200),
       phone VARCHAR(20),
       address TEXT,
       id_card VARCHAR(50) ENCRYPTED,
       data_classification VARCHAR(20) CHECK (data_classification IN ('public', 'sensitive', 'confidential'))
   );
   
   -- 为敏感数据添加审计标记
   COMMENT ON COLUMN citizens.id_card IS 'PII - 个人身份信息';
   COMMENT ON COLUMN citizens.email IS 'PII - 个人联系方式';
   COMMENT ON COLUMN citizens.phone IS 'PII - 个人联系方式';
   ```

2. **访问控制审计**：
   ```sql
   -- 创建审计表记录所有数据访问
   CREATE TABLE data_access_audit (
       id BIGSERIAL PRIMARY KEY,
       user_id VARCHAR(50),
       accessed_table VARCHAR(100),
       operation VARCHAR(20),
       accessed_at TIMESTAMP,
       purpose_code VARCHAR(50),
       data_returned BOOLEAN
   );
   
   -- 创建触发器自动记录访问
   CREATE OR REPLACE FUNCTION log_data_access()
   RETURNS TRIGGER AS $$
   BEGIN
       INSERT INTO data_access_audit (user_id, accessed_table, operation, purpose_code, accessed_at, data_returned)
       VALUES (CURRENT_USER, TG_TABLE_NAME, TG_OP, TG_ARGV[0], NOW(), false);
       RETURN NULL;
   END;
   $$ LANGUAGE plpgsql;
   
   CREATE TRIGGER audit_data_access
   AFTER SELECT OR UPDATE OR DELETE ON citizens
   FOR EACH ROW EXECUTE FUNCTION log_data_access();
   ```

3. **数据删除实现**：
   ```bash
   -- 1. 创建数据删除请求表
   # 在管理后台创建删除请求记录
   
   -- 2. 请求确认流程
   # 用户发送删除请求 → 系统发送确认邮件 → 用户确认 → 执行删除
   
   -- 3. 软删除标记
   UPDATE citizens
   SET deleted = true,
       deleted_at = NOW()
   WHERE id = $citizen_id;
   
   -- 4. 硬删除（定期批处理）
   -- 使用 gs_dump 工具导出要删除的数据到加密文件
   gs_dump -h $HOST -U $USER -d $DB_NAME -t citizens -f backup_deleted.sql --clean
   
   -- 5. 保留期管理
   -- 软删除数据保留 30 天用于恢复，之后硬删除
   ```

4. **数据导出功能**：
   ```bash
   -- 实现安全的数据导出
   gs_dump -h $HOST -U $USER -d $DB_NAME -t citizens \
     -f gdpr_export_$citizen_id.sql \
     --clean \
     --format=custom \
     --field-delimiter='|'
   
   -- 使用加密传输
   gs_dump ... | gpg --encrypt --recipient 'dp_officer@example.com'
   ```

5. **合规报告生成**：
   ```sql
   -- 生成合规报告
   SELECT 
       COUNT(*) FILTER (WHERE deleted = false) AS active_records,
       COUNT(*) FILTER (WHERE deleted = true) AS deleted_records,
       COUNT(DISTINCT user_id) AS total_access_requests,
       COUNT(DISTINCT purpose_code) AS data_export_count
   FROM citizens;
   
   -- 按数据分类统计
   SELECT 
       data_classification,
       COUNT(*) AS record_count
   FROM citizens
   GROUP BY data_classification;
   ```

**合规检查清单**:
- [ ] 实施数据分类和敏感性标记
- [ ] 配置完整的访问审计日志
- [ ] 建立数据删除请求和确认流程
- [ ] 实现数据加密（静态和传输）
- [ ] 实现数据导出和可携性功能
- [ ] 配置自动合规报告生成
- [ ] 定期进行合规性审计
- [ ] 指定数据保护官（DPO）
- [ ] 建立数据泄露应急响应流程
- [ ] 与监管部门保持沟通和报告

通过分析此案例，学习如何在政府机构中实施 GDPR 合规要求，包括数据最小化、用户同意、删除权、可携性等核心要求。

**SQL 注入防护案例：电商平台安全漏洞**

某电商平台的用户登录和搜索功能被发现存在严重的 SQL 注入漏洞，攻击者可以：
- 绕过身份验证直接登录管理员账户
- 窃取用户敏感信息（密码、支付信息）
- 修改订单数据造成财务损失
- 删除或篡改数据库数据

**漏洞场景**:
```php
// 存在漏洞的登录代码（PHP 示例）
$username = $_POST['username'];
$password = $_POST['password'];

// 危险：直接拼接用户输入到 SQL 语句
$query = "SELECT * FROM users WHERE username = '" . $username . "' AND password = '" . $password . "'";
$result = $db->query($query);
```

**攻击方式**:
1. **管理员账户绕过**：
   ```
   攻击者输入用户名：admin' OR '1'='1
   生成的 SQL：SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = '...'
   结果：返回所有用户记录，绕过密码验证
   ```

2. **数据窃取**：
   ```
   攻击者在搜索框输入：' UNION SELECT username, password, 'x' FROM users --
   生成的 SQL：SELECT * FROM products WHERE name LIKE '' UNION SELECT username, password, 'x' FROM users --'
   结果：返回所有用户的用户名和密码
   ```

3. **批量数据删除**：
   ```
   攻击者在用户 ID 输入框：123; DROP TABLE orders; --
   生成的 SQL：SELECT * FROM orders WHERE user_id = 123; DROP TABLE orders; --
   结果：删除整个订单表
   ```

4. **数据篡改**：
   ```
   攻击者在订单状态更新接口：admin' WHERE order_id = '12345'; UPDATE orders SET amount = '0.01' WHERE order_id = '12345' --
   生成的 SQL：UPDATE orders SET status = 'admin' WHERE order_id = '12345'; UPDATE orders SET amount = '0.01' WHERE order_id = '12345' --
   结果：将订单金额篡改为 0.01 元
   ```

**安全加固措施**:
1. **使用参数化查询（Prepared Statements）**：
   ```php
   // 安全的登录代码（使用参数化查询）
   $username = $_POST['username'];
   $password = $_POST['password'];

   // 使用预处理语句
   $stmt = $db->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
   $stmt->bind_param("ss", $username, $password);
   $stmt->execute();
   $result = $stmt->get_result();
   ```

   ```python
   # Python 使用 psycopg2 参数化查询
   import psycopg2

   username = request.form['username']
   password = request.form['password']

   conn = psycopg2.connect(database="ecommerce", user="app_user")
   cur = conn.cursor()

   # 参数化查询
   cur.execute("SELECT * FROM users WHERE username = %s AND password = %s",
               (username, password))
   result = cur.fetchone()
   ```

   ```java
   // Java 使用 JDBC PreparedStatement
   String username = request.getParameter("username");
   String password = request.getParameter("password");

   String query = "SELECT * FROM users WHERE username = ? AND password = ?";
   PreparedStatement stmt = connection.prepareStatement(query);
   stmt.setString(1, username);
   stmt.setString(2, password);
   ResultSet rs = stmt.executeQuery();
   ```

2. **输入验证和过滤**：
   ```python
   # 输入验证示例
   import re

   def validate_username(username):
       # 检查长度
       if not 3 <= len(username) <= 50:
           return False

       # 只允许字母、数字和下划线
       if not re.match(r'^[a-zA-Z0-9_]+$', username):
           return False

       return True

   def sanitize_input(user_input):
       # 转义特殊字符
       dangerous_chars = ["'", "\"", ";", "--", "/*", "*/"]
       for char in dangerous_chars:
           user_input = user_input.replace(char, "\\" + char)
       return user_input
   ```

3. **最小权限原则**：
   ```sql
   -- 为应用程序创建专用账户，仅授予必要权限
   CREATE USER app_user WITH PASSWORD 'strong_password';

   -- 授予应用数据库的基本权限（不授予 DROP、GRANT 等危险权限）
   GRANT CONNECT ON DATABASE ecommerce TO app_user;
   GRANT USAGE ON SCHEMA public TO app_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

   -- 撤销危险权限
   REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE products TO app_user;
   GRANT SELECT, INSERT, UPDATE ON TABLE orders TO app_user;
   GRANT SELECT ON TABLE users TO app_user;  -- 只读用户表
   ```

4. **数据库审计和监控**：
   ```sql
   -- 启用 SQL 审计记录可疑查询
   CREATE TABLE sql_injection_audit (
       id BIGSERIAL PRIMARY KEY,
       user_name VARCHAR(50),
       query_text TEXT,
       query_time TIMESTAMP,
       ip_address VARCHAR(50),
       suspicious_patterns TEXT[]
   );

   -- 创建检测函数
   CREATE OR REPLACE FUNCTION detect_sql_injection()
   RETURNS TRIGGER AS $$
   DECLARE
       patterns TEXT[] := ARRAY[
           ''' OR ''1''=''1',
           ''' OR 1=1',
           'UNION SELECT',
           'DROP TABLE',
           '; --',
           '/*',
           '*/'
       ];
       suspicious TEXT[] := '{}';
       i INTEGER;
   BEGIN
       -- 检查查询中是否包含可疑模式
       FOR i IN 1..array_length(patterns, 1) LOOP
           IF position(patterns[i] IN current_query()) > 0 THEN
               suspicious := array_append(suspicious, patterns[i]);
           END IF;
       END LOOP;

       -- 如果发现可疑模式，记录到审计表
       IF array_length(suspicious, 1) > 0 THEN
           INSERT INTO sql_injection_audit (user_name, query_text, query_time, ip_address, suspicious_patterns)
           VALUES (CURRENT_USER, current_query(), NOW(), inet_client_addr(), suspicious);

           -- 可选：发送告警通知
           -- PERFORM pg_notify('security_alert', 'Possible SQL injection attempt detected');
       END IF;

       RETURN NULL;
   END;
   $$ LANGUAGE plpgsql;

   -- 为所有表创建审计触发器
   CREATE TRIGGER audit_sql_injection
   AFTER INSERT OR UPDATE OR DELETE ON users
   FOR EACH STATEMENT EXECUTE FUNCTION detect_sql_injection();
   ```

5. **Web 应用防火墙（WAF）配置**：
   ```nginx
   # Nginx 配置示例：阻止常见 SQL 注入模式
   location / {
       # 阻止包含 SQL 注入特征的请求
       if ($args ~* "(\%27)|(\')|(\-\-)|(\%23)|(#)") {
           return 403;
       }

       if ($request_uri ~* "(\%27)|(\')|(\-\-)|(\%23)|(#)") {
           return 403;
       }

       if ($args ~* "(\%3D)|(=)[^\n]*\*(\%27)|(\')|(\-\-)|(\%3B)|(;)|(\<\%3C)|(<).*script.*(>|%3E)") {
           return 403;
       }

       # 限制请求大小
       client_max_body_size 10M;

       # 限制请求速率
       limit_req zone=one burst=10 nodelay;

       proxy_pass http://backend_app;
   }

   # 创建速率限制区域
   limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
   ```

6. **加密敏感数据**：
   ```sql
   -- 使用 pgcrypto 扩展加密密码字段
   CREATE EXTENSION IF NOT EXISTS pgcrypto;

   -- 创建用户表（密码存储加密哈希）
   CREATE TABLE users (
       id BIGSERIAL PRIMARY KEY,
       username VARCHAR(50) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,  -- 存储加密的密码哈希
       email VARCHAR(100),
       created_at TIMESTAMP DEFAULT NOW(),
       failed_login_attempts INTEGER DEFAULT 0,
       account_locked BOOLEAN DEFAULT FALSE
   );

   -- 创建密码加密函数（使用 bcrypt）
   CREATE OR REPLACE FUNCTION hash_password(plain_password TEXT)
   RETURNS VARCHAR(255) AS $$
   BEGIN
       -- 使用 digest 函数创建 SHA-256 哈希
       RETURN encode(digest(plain_password, 'sha256'), 'hex');
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- 创建密码验证函数
   CREATE OR REPLACE FUNCTION verify_password(plain_password TEXT, stored_hash TEXT)
   RETURNS BOOLEAN AS $$
   DECLARE
       computed_hash VARCHAR(255);
   BEGIN
       computed_hash := encode(digest(plain_password, 'sha256'), 'hex');
       RETURN computed_hash = stored_hash;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- 使用示例
   INSERT INTO users (username, password_hash, email)
   VALUES ('admin', hash_password('secure_password_123'), 'admin@example.com');

   -- 验证登录
   SELECT id, username
   FROM users
   WHERE username = 'admin'
     AND verify_password('secure_password_123', password_hash)
     AND account_locked = FALSE;
   ```

**测试和验证**:
```bash
# 使用 SQLMap 工具进行自动化渗透测试
# 1. 检测 URL 参数中的 SQL 注入漏洞
sqlmap -u "http://example.com/login?username=admin&password=123" \
       --batch --level=5 --risk=3

# 2. 检测 POST 请求中的 SQL 注入漏洞
sqlmap -u "http://example.com/login" \
       --data="username=admin&password=123" \
       --method=POST --batch --level=5 --risk=3

# 3. 使用代理（如 Burp Suite）捕获请求进行测试
sqlmap -r request.txt --batch

# 4. 测试特定的注入点
sqlmap -u "http://example.com/product?id=1" -p id \
       --batch --dbms=postgresql

# 验证修复效果
# 重新运行测试，确认漏洞已修复
sqlmap -u "http://example.com/login?username=admin&password=123" \
       --batch --level=5 --risk=3 --technique=BEUSTQ
```

**防护效果**:
- SQL 注入攻击成功率从 100% 降至 0%
- 应用数据库账户权限最小化，攻击面减少 90%
- 审计日志覆盖 100% 的数据库访问
- 可疑攻击检测时间从数小时缩短到实时
- 数据泄露风险从高风险降至极低风险

**最佳实践清单**:
- [ ] 所有数据库查询使用参数化查询
- [ ] 实施严格的输入验证和过滤
- [ ] 遵循最小权限原则配置数据库账户
- [ ] 启用全面的 SQL 审计和监控
- [ ] 配置 Web 应用防火墙（WAF）
- [ ] 定期使用 SQLMap 等工具进行渗透测试
- [ ] 使用加密存储敏感信息（如密码）
- [ ] 实施登录失败限制和账户锁定
- [ ] 定期更新应用框架和依赖库
- [ ] 培训开发团队安全编码规范

通过分析此案例，学习如何识别 SQL 注入漏洞，实施多层防护措施，建立完善的安全监控和审计机制，确保 Web 应用的数据库安全。

## 学习内容

本章节包含以下步骤：
1. **安全基础和威胁模型** - 了解安全威胁和防护策略
2. **用户管理和 RBAC** - 掌握用户、角色和权限管理
3. **数据加密** - 配置静态加密和传输加密
4. **审计和合规日志** - 启用审计日志和合规监控
5. **行级安全** - 实施行级安全（RLS）和数据脱敏
6. **安全加固** - 安全加固最佳实践

<font color=darkred>*注意: 本章节需要您已经完成所有前置章节的学习*</font>

## 前置要求

- 完成"GaussDB 架构与原理"章节
- 完成"安装与配置"章节
- 完成"SQL 开发基础"章节
- 了解基本的安全概念和法规要求
