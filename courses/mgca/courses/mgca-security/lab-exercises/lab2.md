# Security Module - L2 Lab: Row-Level Security

## Lab Overview

In this L2 (Intermediate Level) lab, you will practice advanced security operations in GaussDB, including:
- Implementing row-level security (RLS) policies
- Using data masking for sensitive columns
- Configuring SSL/TLS encryption
- Setting up audit logging

**Time Required**: 35 minutes
**Prerequisites**: Completed L1 Security Lab, test data in database

## Learning Objectives

By completing this lab, you will be able to:
- Create and manage RLS policies for row-level access control
- Implement data masking for sensitive data
- Configure SSL/TLS for encrypted connections
- Set up comprehensive audit logging

## Lab Tasks

### Task 1: Create Test Data for RLS

Let's create test tables with sensitive data to practice RLS.

**Create multi-tenant table**:
```sql
CREATE TABLE tenant_data (
    id INT PRIMARY KEY,
    tenant_id INT NOT NULL,
    sensitive_data TEXT,
    public_data TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tenant_data VALUES
    (1, 1, 'Secret info for tenant 1', 'Public info for tenant 1', 100, CURRENT_TIMESTAMP),
    (2, 1, 'Secret info 2', 'Public info 2', 100, CURRENT_TIMESTAMP),
    (3, 2, 'Secret info 3', 'Public info 3', 100, CURRENT_TIMESTAMP),
    (4, 2, 'Secret info 4', 'Public info 4', 100, CURRENT_TIMESTAMP),
    (5, 1, 'Secret info 5', 'Public info 5', 100, CURRENT_TIMESTAMP),
    (6, 2, 'Secret info 6', 'Public info 6', 100, CURRENT_TIMESTAMP),
    (7, 2, 'Secret info 7', 'Public info 7', 100, CURRENT_TIMESTAMP),
    (8, 2, 'Secret info 8', 'Public info 8', 100, CURRENT_TIMESTAMP),
    (9, 1, 'Secret info for tenant 1', 'Public info for tenant 1', 100, CURRENT_TIMESTAMP),
    (10, 1, 'Secret info 10', 'Public info 10', 100, CURRENT_TIMESTAMP);
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE tenant_data (id INT PRIMARY KEY, tenant_id INT NOT NULL, sensitive_data TEXT, public_data TEXT, created_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO tenant_data VALUES (1, 1, 'Secret info for tenant 1', 'Public info for tenant 1', 100, CURRENT_TIMESTAMP), (2, 1, 'Secret info 2', 'Public info 2', 100, CURRENT_TIMESTAMP), (3, 2, 'Secret info 3', 'Public info 3', 100, CURRENT_TIMESTAMP), (4, 2, 'Secret info 4', 'Public info 4', 100, CURRENT_TIMESTAMP), (5, 1, 'Secret info 5', 'Public info 5', 100, CURRENT_TIMESTAMP), (6, 2, 'Secret info 6', 'Public info 6', 100, CURRENT_TIMESTAMP), (7, 2, 'Secret info 7', 'Public info 7', 100, CURRENT_TIMESTAMP), (8, 2, 'Secret info 8', 'Public info 8', 100, CURRENT_TIMESTAMP), (9, 1, 'Secret info for tenant 1', 'Public info for tenant 1', 100, CURRENT_TIMESTAMP), (10, 1, 'Secret info 10', 'Public info 10', 100, CURRENT_TIMESTAMP);"]]{{RUN}}

**Create users for different tenants**:
```sql
CREATE USER tenant1_user WITH PASSWORD 'Tenant1!';
CREATE USER tenant2_user WITH PASSWORD 'Tenant2!';
```

[[gsql -d postgres -p 5432 -c "CREATE USER tenant1_user WITH PASSWORD 'Tenant1!'; CREATE USER tenant2_user WITH PASSWORD 'Tenant2!';"]]{{RUN}}

**Grant access**:
```sql
GRANT SELECT ON tenant_data TO tenant1_user;
GRANT SELECT ON tenant_data TO tenant2_user;
```

[[gsql -d postgres -p 5432 -c "GRANT SELECT ON tenant_data TO tenant1_user; GRANT SELECT ON tenant_data TO tenant2_user;"]]{{RUN}}

---

### Task 2: Enable Row-Level Security

Let's enable RLS and create policies for tenant isolation.

**Enable RLS on table**:
```sql
ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;
```

[[gsql -d postgres -p 5432 -c "ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;"]]{{RUN}}

**Create RLS policy for tenant 1**:
```sql
CREATE POLICY tenant1_isolation_policy ON tenant_data
    FOR SELECT
    TO tenant1_user
    USING (tenant_id = 1);
```

[[gsql -d postgres -p 5432 -c "CREATE POLICY tenant1_isolation_policy ON tenant_data FOR SELECT TO tenant1_user USING (tenant_id = 1);"]]{{RUN}}

**Create RLS policy for tenant 2**:
```sql
CREATE POLICY tenant2_isolation_policy ON tenant_data
    FOR SELECT
    TO tenant2_user
    USING (tenant_id = 2);
```

[[gsql -d postgres -p 5432 -c "CREATE POLICY tenant2_isolation_policy ON tenant_data FOR SELECT TO tenant2_user USING (tenant_id = 2);"]]{{RUN}}

**Verify policies created**:
```sql
SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    policyname AS policy_name,
    roles AS allowed_roles,
    cmd AS command_type,
    qual AS policy_qualification
FROM pg_policies
WHERE tablename = 'tenant_data'
ORDER BY policyname;
```

[[gsql -d postgres -p 5432 -c "SELECT schemaname AS schema_name, tablename AS table_name, policyname AS policy_name, roles AS allowed_roles, cmd AS command_type, qual AS policy_qualification FROM pg_policies WHERE tablename = 'tenant_data' ORDER BY policyname;"]]{{RUN}}

---

### Task 3: Test Row-Level Security Policies

Let's test that RLS policies are working correctly.

**Test as tenant1_user**:
```sql
SET ROLE tenant1_user;
SELECT id, tenant_id, sensitive_data, public_data 
FROM tenant_data 
ORDER BY id;
RESET ROLE;
```

[[gsql -d postgres -p 5432 -c "SET ROLE tenant1_user; SELECT id, tenant_id, sensitive_data, public_data FROM tenant_data ORDER BY id; RESET ROLE;"]]{{RUN}}

**Expected**: Should see only rows where tenant_id = 1 (rows 1, 9, 10)

**Test as tenant2_user**:
```sql
SET ROLE tenant2_user;
SELECT id, tenant_id, sensitive_data, public_data 
FROM tenant_data 
ORDER BY id;
RESET ROLE;
```

[[gsql -d postgres -p 5432 -c "SET ROLE tenant2_user; SELECT id, tenant_id, sensitive_data, public_data FROM tenant_data ORDER BY id; RESET ROLE;"]]{{RUN}}

**Expected**: Should see only rows where tenant_id = 2 (rows 2-8)

**Test without RLS** (as superuser):
```sql
SELECT count(*) AS total_rows FROM tenant_data;
```

[[gsql -d postgres -p 5432 -c "SELECT count(*) AS total_rows FROM tenant_data;"]]{{RUN}}

**Expected**: All 10 rows (bypass RLS as superuser)

---

### Task 4: Implement Data Masking

Let's create views that mask sensitive data for reporting.

**Create masked view for reporting**:
```sql
CREATE OR REPLACE VIEW tenant_data_masked AS
SELECT 
    id,
    tenant_id,
    CASE 
        WHEN tenant_id = 1 THEN 'MASKED'
        ELSE sensitive_data
    END AS sensitive_data,
    public_data,
    created_at,
    SUBSTRING(public_data, 1, 3) || '...' AS public_data_preview
FROM tenant_data;
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE VIEW tenant_data_masked AS SELECT id, tenant_id, CASE WHEN tenant_id = 1 THEN 'MASKED' ELSE sensitive_data END AS sensitive_data, public_data, created_at, SUBSTRING(public_data, 1, 3) || '...' AS public_data_preview FROM tenant_data;"]]{{RUN}}

**Grant access to masked view**:
```sql
GRANT SELECT ON tenant_data_masked TO tenant1_user;
GRANT SELECT ON tenant_data_masked TO tenant2_user;
```

[[gsql -d postgres -p 5432 -c "GRANT SELECT ON tenant_data_masked TO tenant1_user; GRANT SELECT ON tenant_data_masked TO tenant2_user;"]]{{RUN}}

**Test masked view**:
```sql
SET ROLE tenant1_user;
SELECT * FROM tenant_data_masked WHERE tenant_id = 1 LIMIT 3;
RESET ROLE;
```

[[gsql -d postgres -p 5432 -c "SET ROLE tenant1_user; SELECT * FROM tenant_data_masked WHERE tenant_id = 1 LIMIT 3; RESET ROLE;"]]{{RUN}}

**Expected**: Should see 'MASKED' in sensitive_data column instead of actual values

---

### Task 5: Configure SSL/TLS Encryption

Let's configure SSL for encrypted database connections.

**Check current SSL settings**:
```sql
SHOW ssl;
SHOW ssl_cert_file;
SHOW ssl_key_file;
SHOW ssl_ca_file;
```

[[gsql -d postgres -p 5432 -c "SHOW ssl; SHOW ssl_cert_file; SHOW ssl_key_file; SHOW ssl_ca_file;"]]{{RUN}}

**Enable SSL**:
```sql
ALTER SYSTEM SET ssl = 'on';
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET ssl = 'on';"]]{{RUN}}

**Note**: In production, you would also set:
- ssl_cert_file = '/path/to/server.crt'
- ssl_key_file = '/path/to/server.key'
- ssl_ca_file = '/path/to/ca.crt'

**Reload configuration**:
```sql
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -c "SELECT pg_reload_conf();"]]{{RUN}}

**Verify SSL is enabled**:
```sql
SHOW ssl;
```

[[gsql -d postgres -p 5432 -c "SHOW ssl;"]]{{RUN}}

**Expected**: Should show 'on'

---

### Task 6: Configure Audit Logging

Let's set up comprehensive audit logging for security compliance.

**Check current audit settings**:
```sql
SHOW pgaudit.log;
SHOW pgaudit.log_client;
SHOW pgaudit.log_level;
```

[[gsql -d postgres -p 5432 -c "SHOW pgaudit.log; SHOW pgaudit.log_client; SHOW pgaudit.log_level;"]]{{RUN}}

**Enable audit logging**:
```sql
-- Enable audit for all statements
ALTER SYSTEM SET pgaudit.log = 'all';

-- Include client information
ALTER SYSTEM SET pgaudit.log_client = 'on';

-- Set log level to include READ, WRITE, DDL, DML
ALTER SYSTEM SET pgaudit.log_level = 'read, write, ddl, dml';
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET pgaudit.log = 'all'; ALTER SYSTEM SET pgaudit.log_client = 'on'; ALTER SYSTEM SET pgaudit.log_level = 'read, write, ddl, dml';"]]{{RUN}}

**Reload configuration**:
```sql
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -c "SELECT pg_reload_conf();"]]{{RUN}}

**Test audit logging**:
```sql
-- Perform some operations
INSERT INTO tenant_data (id, tenant_id, sensitive_data, public_data, created_by)
VALUES (11, 1, 'Test audit', 'Public test', 100, CURRENT_TIMESTAMP);

UPDATE tenant_data SET sensitive_data = 'Updated' WHERE id = 1;
```

[[gsql -d postgres -p 5432 -c "INSERT INTO tenant_data (id, tenant_id, sensitive_data, public_data, created_by) VALUES (11, 1, 'Test audit', 'Public test', 100, CURRENT_TIMESTAMP); UPDATE tenant_data SET sensitive_data = 'Updated' WHERE id = 1;"]]{{RUN}}

**Check audit logs**:
```bash
tail -20 /opt/huawei/install/data/db1/pg_audit/*.log
```

[[tail -20 /opt/huawei/install/data/db1/pg_audit/*.log]]{{RUN}}

**What to look for**:
- INSERT and UPDATE statements logged
- User information (who made the change)
- Timestamp of operations
- Command details

---

### Task 7: Create Audit Report View

Let's create a view for reporting audit activity.

**Create audit summary view**:
```sql
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
    audited_user,
    audited_database,
    audit_time,
    command_tag,
    object_type,
    object_name,
    statement
FROM pg_audit_log
WHERE audit_time >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY audit_time DESC;
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE VIEW audit_summary AS SELECT audited_user, audited_database, audit_time, command_tag, object_type, object_name, statement FROM pg_audit_log WHERE audit_time >= CURRENT_DATE - INTERVAL '7 days' ORDER BY audit_time DESC;"]]{{RUN}}

**Query audit summary**:
```sql
SELECT 
    audited_user,
    count(*) AS operation_count,
    command_tag,
    min(audit_time) AS first_seen,
    max(audit_time) AS last_seen
FROM audit_summary
GROUP BY audited_user, command_tag
ORDER BY operation_count DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT audited_user, count(*) AS operation_count, command_tag, min(audit_time) AS first_seen, max(audit_time) AS last_seen FROM audit_summary GROUP BY audited_user, command_tag ORDER BY operation_count DESC;"]]{{RUN}}

---

### Task 8: Implement Bypass RLS for Admin

Let's create an admin role that can bypass RLS policies.

**Create admin role**:
```sql
CREATE ROLE security_admin WITH NOBYPASSRLS;
```

[[gsql -d postgres -p 5432 -c "CREATE ROLE security_admin WITH NOBYPASSRLS;"]]{{RUN}}

**Grant admin to superuser**:
```sql
GRANT security_admin TO current_user;
```

[[gsql -d postgres -p 5432 -c "GRANT security_admin TO current_user;"]]{{RUN}}

**Test bypass RLS**:
```sql
SET ROLE security_admin;
SELECT count(*) AS total_rows_seen FROM tenant_data;
RESET ROLE;
```

[[gsql -d postgres -p 5432 -c "SET ROLE security_admin; SELECT count(*) AS total_rows_seen FROM tenant_data; RESET ROLE;"]]{{RUN}}

**Expected**: Should see all 10+ rows (bypasses RLS)

**Create admin user for production use**:
```sql
CREATE USER admin_user WITH PASSWORD 'SecureAdmin!' SECURITY_ADMIN;
```

[[gsql -d postgres -p 5432 -c "CREATE USER admin_user WITH PASSWORD 'SecureAdmin!' SECURITY_ADMIN;"]]{{RUN}}

---

### Task 9: Clean Up Test Data

Let's clean up test objects created during this lab.

**Drop test tables and views**:
```sql
DROP VIEW IF EXISTS tenant_data_masked;
DROP VIEW IF EXISTS audit_summary;
DROP TABLE IF EXISTS tenant_data;
```

[[gsql -d postgres -p 5432 -c "DROP VIEW IF EXISTS tenant_data_masked; DROP VIEW IF EXISTS audit_summary; DROP TABLE IF EXISTS tenant_data;"]]{{RUN}}

**Drop test users and roles**:
```sql
DROP USER IF EXISTS tenant1_user;
DROP USER IF EXISTS tenant2_user;
DROP USER IF EXISTS admin_user;
DROP ROLE IF EXISTS security_admin;
```

[[gsql -d postgres -p 5432 -c "DROP USER IF EXISTS tenant1_user; DROP USER IF EXISTS tenant2_user; DROP USER IF EXISTS admin_user; DROP ROLE IF EXISTS security_admin;"]]{{RUN}}

**Reset SSL settings** (for lab environment):
```sql
ALTER SYSTEM SET ssl = 'off';
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET ssl = 'off'; SELECT pg_reload_conf();"]]{{RUN}}

**Reset audit settings** (for lab environment):
```sql
ALTER SYSTEM SET pgaudit.log = 'none';
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET pgaudit.log = 'none'; SELECT pg_reload_conf();"]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Created multi-tenant test data
- [ ] Task 2: Enabled row-level security and created RLS policies
- [ ] Task 3: Tested RLS policies with different users
- [ ] Task 4: Implemented data masking with views
- [ ] Task 5: Configured SSL/TLS encryption
- [ ] Task 6: Set up audit logging
- [ ] Task 7: Created audit summary views
- [ ] Task 8: Implemented bypass RLS for admin
- [ ] Task 9: Cleaned up test data

## Review Questions

1. **What does enabling ROW LEVEL SECURITY do?**
   - [ ] Compresses data
   - [ ] Enables row-level access control through policies
   - [ ] Encrypts all data
   - [ ] Creates indexes automatically

2. **What is the purpose of NOBYPASSRLS attribute?**
   - [ ] Encrypts RLS policies
   - [ ] Allows role to bypass RLS restrictions
   - [ ] Makes role read-only
   - [ ] Disables row-level security entirely

3. **What is a common data masking technique?**
   - [ ] Store all data unencrypted
   - [ ] Replace sensitive values with masked versions in views
   - [ ] Delete sensitive columns
   - [ ] Encrypt sensitive columns

4. **What does audit logging capture?**
   - [ ] Only errors
   - [ ] All SQL statements executed
   - [ ] Connection attempts only
   - [ ] Performance metrics

## Summary

In this L2 lab, you practiced:
- **Row-Level Security**: Enabling RLS and creating tenant isolation policies
- **RLS Testing**: Verifying policies work correctly for different users
- **Data Masking**: Creating views with masked sensitive data
- **SSL/TLS**: Configuring encrypted database connections
- **Audit Logging**: Setting up comprehensive audit logging
- **Audit Reporting**: Creating views for audit activity analysis
- **Bypass RLS**: Creating admin roles that can bypass RLS for management
- **Cleanup**: Removing test objects and resetting configurations

These intermediate security operations enable you to implement multi-tenant isolation, data masking, encryption, and comprehensive auditing in GaussDB.

## Best Practices

1. **Policy Design**: Keep RLS policies simple and focused
2. **Testing**: Always test RLS policies thoroughly in production
3. **Masking**: Use masking for non-production environments
4. **Audit Retention**: Define audit log retention policies
5. **Least Privilege**: Give NOBYPASSRLS only to necessary admin roles

## Next Steps

Proceed to **L3 Lab** to practice advanced security operations including:
- Advanced RLS policies with complex conditions
- Column-level encryption (TDE)
- Advanced audit filtering and alerting
- Security hardening checklist implementation
- Compliance reporting automation
