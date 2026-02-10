# Security Module - L3 Lab: Advanced Security Features and Performance Trade-offs

## Lab Overview

In this L3 (Advanced Level) lab, you will practice advanced security configuration in GaussDB, including:
- Performance impact of security features
- Advanced authentication methods
- Fine-grained access control
- Security auditing and monitoring
- Performance optimization with security

**Time Required**: 55 minutes
**Prerequisites**: Completed L1 and L2 Security Labs, database admin access

## Learning Objectives

By completing this lab, you will be able to:
- Understand performance impact of security features
- Configure advanced authentication mechanisms
- Implement fine-grained access control
- Set up comprehensive security auditing
- Optimize performance while maintaining security

## Lab Tasks

### Task 1: Performance Impact of Security Features

Measure overhead of security features on database performance.

**Create performance test table**:
```sql
CREATE TABLE security_perf_test (
    id INT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO security_perf_test
SELECT 
    generate_series(1, 100000),
    'user_' || generate_series(1, 100000),
    'user' || generate_series(1, 100000) || '@example.com',
    'Secure data ' || repeat('x', 100),
    CURRENT_TIMESTAMP - (random() * 365)::INT;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE security_perf_test (id INT PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO security_perf_test SELECT generate_series(1, 100000), 'user_' || generate_series(1, 100000), 'user' || generate_series(1, 100000) || '@example.com', 'Secure data ' || repeat('x', 100), CURRENT_TIMESTAMP - (random() * 365)::INT;"]]{{RUN}}

**Baseline performance without RLS**:
```sql
EXPLAIN ANALYZE
SELECT COUNT(*) FROM security_perf_test WHERE username = 'user_50000';

EXPLAIN ANALYZE
SELECT * FROM security_perf_test WHERE username = 'user_50000';
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT COUNT(*) FROM security_perf_test WHERE username = 'user_50000'; EXPLAIN ANALYZE SELECT * FROM security_perf_test WHERE username = 'user_50000';"]]{{RUN}}

**Enable Row-Level Security (RLS)**:
```sql
-- Enable RLS on table
ALTER TABLE security_perf_test ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY user_isolation_policy
ON security_perf_test
FOR ALL
TO PUBLIC
USING (username = current_user);

-- Test performance with RLS enabled
EXPLAIN ANALYZE
SELECT COUNT(*) FROM security_perf_test WHERE username = current_user;

EXPLAIN ANALYZE
SELECT * FROM security_perf_test WHERE username = current_user;
```

[[gsql -d postgres -p 5432 -c "ALTER TABLE security_perf_test ENABLE ROW LEVEL SECURITY; CREATE POLICY user_isolation_policy ON security_perf_test FOR ALL TO PUBLIC USING (username = current_user); EXPLAIN ANALYZE SELECT COUNT(*) FROM security_perf_test WHERE username = current_user; EXPLAIN ANALYZE SELECT * FROM security_perf_test WHERE username = current_user;"]]{{RUN}}

**Compare performance metrics**:
```sql
-- Check if RLS is applied
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'security_perf_test';
```

[[gsql -d postgres -p 5432 -c "SELECT tablename, rowsecurity AS rls_enabled FROM pg_tables WHERE tablename = 'security_perf_test';"]]{{RUN}}

**What to observe**:
- RLS adds security overhead to queries
- Query plans show additional filtering
- Performance impact depends on query complexity

---

### Task 2: Advanced Authentication Configuration

Configure multiple authentication methods and understand their trade-offs.

**Check current authentication configuration**:
```bash
# View pg_hba.conf authentication settings
cat /usr/local/pgsql/data/pg_hba.conf | grep -v "^#" | grep -v "^$"
```

[[bash -c "cat /usr/local/pgsql/data/pg_hba.conf | grep -v \"^#\" | grep -v \"^$\""]]{{RUN}}

**Configure multiple authentication methods**:
```sql
-- Create test users
CREATE USER auth_test_md5 WITH PASSWORD 'password123';
CREATE USER auth_test_scram WITH PASSWORD 'password123';
CREATE USER auth_test_cert WITH PASSWORD 'password123';

-- Set password encryption method
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -c "CREATE USER auth_test_md5 WITH PASSWORD 'password123'; CREATE USER auth_test_scram WITH PASSWORD 'password123'; CREATE USER auth_test_cert WITH PASSWORD 'password123'; ALTER SYSTEM SET password_encryption = 'scram-sha-256'; SELECT pg_reload_conf();"]]{{RUN}}

**Test authentication performance**:
```bash
# Time authentication attempts
echo "Testing MD5 authentication:"
time psql -h localhost -p 5432 -U auth_test_md5 -d postgres -c "SELECT current_user, current_database();" 2>&1

echo ""
echo "Testing SCRAM authentication:"
time psql -h localhost -p 5432 -U auth_test_scram -d postgres -c "SELECT current_user, current_database();" 2>&1
```

[[bash -c "echo \"Testing MD5 authentication:\" && time psql -h localhost -p 5432 -U auth_test_md5 -d postgres -c \"SELECT current_user, current_database();\" 2>&1 && echo \"\" && echo \"Testing SCRAM authentication:\" && time psql -h localhost -p 5432 -U auth_test_scram -d postgres -c \"SELECT current_user, current_database();\" 2>&1"]]{{RUN}}

**Create LDAP authentication setup**:
```bash
# Create LDAP authentication configuration
cat > /tmp/ldap_auth_setup.sh <<'SCRIPT'
#!/bin/bash

echo "LDAP Authentication Configuration for pg_hba.conf:"
cat <<'PGHBA'
# LDAP Authentication (example configuration)
# host all all 192.168.1.0/24 ldap ldapserver=ldap.example.com ldapbasedn="dc=example,dc=com" ldapbinddn="cn=admin,dc=example,dc=com" ldapbindpasswd=secret ldapsearchattribute="uid"
PGHBA

echo ""
echo "Notes:"
echo "- LDAP centralizes user management"
echo "- Requires LDAP server infrastructure"
echo "- Performance depends on LDAP server response time"
echo "- Connection pooling can reduce LDAP overhead"
SCRIPT

chmod +x /tmp/ldap_auth_setup.sh
/tmp/ldap_auth_setup.sh
```

[[bash -c "cat > /tmp/ldap_auth_setup.sh <<'SCRIPT'
#!/bin/bash
echo \"LDAP Authentication Configuration for pg_hba.conf:\"
cat <<'PGHBA'
host all all 192.168.1.0/24 ldap ldapserver=ldap.example.com ldapbasedn=\"dc=example,dc=com\" ldapbinddn=\"cn=admin,dc=example,dc=com\" ldapbindpasswd=secret ldapsearchattribute=\"uid\"
PGHBA
echo \"\"
echo \"Notes:\"
echo \"- LDAP centralizes user management\"
echo \"- Requires LDAP server infrastructure\"
echo \"- Performance depends on LDAP server response time\"
echo \"- Connection pooling can reduce LDAP overhead\"
SCRIPT
chmod +x /tmp/ldap_auth_setup.sh && /tmp/ldap_auth_setup.sh"]]{{RUN}}

**What to observe**:
- SCRAM is more secure but slightly slower than MD5
- LDAP centralizes authentication but adds network dependency
- Authentication method choice balances security and performance

---

### Task 3: Fine-Grained Access Control with RLS

Implement complex RLS policies with performance considerations.

**Create multi-tenant data model**:
```sql
-- Drop existing table if exists
DROP TABLE IF EXISTS tenant_data CASCADE;

CREATE TABLE tenant_data (
    id INT PRIMARY KEY,
    tenant_id INT,
    user_id INT,
    data TEXT,
    sensitivity_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenant and user tables
CREATE TABLE tenants (
    tenant_id INT PRIMARY KEY,
    tenant_name VARCHAR(100),
    subscription_level VARCHAR(20)
);

CREATE TABLE tenant_users (
    user_id INT PRIMARY KEY,
    tenant_id INT REFERENCES tenants(tenant_id),
    role VARCHAR(20)
);

-- Insert sample data
INSERT INTO tenants VALUES
(1, 'Enterprise Tenant', 'premium'),
(2, 'Standard Tenant', 'standard');

INSERT INTO tenant_users VALUES
(100, 1, 'admin'),
(101, 1, 'user'),
(200, 2, 'admin'),
(201, 2, 'user');

INSERT INTO tenant_data
SELECT 
    generate_series(1, 50000),
    (random() * 2 + 1)::INT,
    (random() * 200 + 100)::INT,
    'Data ' || generate_series(1, 50000),
    (ARRAY['public', 'internal', 'confidential'])[floor(random() * 3 + 1)],
    CURRENT_TIMESTAMP - (random() * 365)::INT;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE IF EXISTS tenant_data CASCADE; CREATE TABLE tenant_data (id INT PRIMARY KEY, tenant_id INT, user_id INT, data TEXT, sensitivity_level VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE TABLE tenants (tenant_id INT PRIMARY KEY, tenant_name VARCHAR(100), subscription_level VARCHAR(20)); CREATE TABLE tenant_users (user_id INT PRIMARY KEY, tenant_id INT REFERENCES tenants(tenant_id), role VARCHAR(20)); INSERT INTO tenants VALUES (1, 'Enterprise Tenant', 'premium'), (2, 'Standard Tenant', 'standard'); INSERT INTO tenant_users VALUES (100, 1, 'admin'), (101, 1, 'user'), (200, 2, 'admin'), (201, 2, 'user'); INSERT INTO tenant_data SELECT generate_series(1, 50000), (random() * 2 + 1)::INT, (random() * 200 + 100)::INT, 'Data ' || generate_series(1, 50000), (ARRAY['public', 'internal', 'confidential'])[floor(random() * 3 + 1)], CURRENT_TIMESTAMP - (random() * 365)::INT;"]]{{RUN}}

**Enable RLS with complex policies**:
```sql
-- Enable RLS
ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation
ON tenant_data
FOR ALL
TO PUBLIC
USING (tenant_id = (
    SELECT tenant_id 
    FROM tenant_users 
    WHERE user_id = current_user_id()
));

-- Create sensitivity-based policy for premium tenants
CREATE POLICY sensitivity_filter
ON tenant_data
FOR SELECT
TO PUBLIC
USING (
    tenant_id NOT IN (
        SELECT tenant_id 
        FROM tenants 
        WHERE subscription_level = 'standard'
    )
    OR sensitivity_level IN ('public', 'internal')
);

-- Grant access
GRANT ALL ON tenant_data TO PUBLIC;
GRANT SELECT ON tenants TO PUBLIC;
GRANT SELECT ON tenant_users TO PUBLIC;
```

[[gsql -d postgres -p 5432 -c "ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY; CREATE POLICY tenant_isolation ON tenant_data FOR ALL TO PUBLIC USING (tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id())); CREATE POLICY sensitivity_filter ON tenant_data FOR SELECT TO PUBLIC USING (tenant_id NOT IN (SELECT tenant_id FROM tenants WHERE subscription_level = 'standard') OR sensitivity_level IN ('public', 'internal')); GRANT ALL ON tenant_data TO PUBLIC; GRANT SELECT ON tenants TO PUBLIC; GRANT SELECT ON tenant_users TO PUBLIC;"]]{{RUN}}

**Test RLS performance**:
```sql
-- Test query with RLS
EXPLAIN ANALYZE
SELECT * FROM tenant_data
WHERE sensitivity_level = 'public';

-- Check policy application
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'tenant_data';
```

[[gsql -d postgres -p 5432 -c "EXPLAIN ANALYZE SELECT * FROM tenant_data WHERE sensitivity_level = 'public'; SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'tenant_data';"]]{{RUN}}

**Optimize RLS with indexes**:
```sql
-- Create indexes for RLS policy predicates
CREATE INDEX idx_tenant_data_tenant ON tenant_data(tenant_id);
CREATE INDEX idx_tenant_data_sensitivity ON tenant_data(sensitivity_level);

-- Re-test query performance
EXPLAIN ANALYZE
SELECT * FROM tenant_data
WHERE sensitivity_level = 'public';
```

[[gsql -d postgres -p 5432 -c "CREATE INDEX idx_tenant_data_tenant ON tenant_data(tenant_id); CREATE INDEX idx_tenant_data_sensitivity ON tenant_data(sensitivity_level); EXPLAIN ANALYZE SELECT * FROM tenant_data WHERE sensitivity_level = 'public';"]]{{RUN}}

**What to observe**:
- Complex RLS policies can impact query performance
- Indexes on policy predicate columns improve performance
- Policy complexity trades off with query speed

---

### Task 4: Comprehensive Security Auditing

Set up detailed security monitoring with performance considerations.

**Configure audit logging**:
```sql
-- Enable logging for security events
ALTER SYSTEM SET log_min_duration_statement = 0;  -- Log all queries
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_statement = 'all';  -- Log all statements
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Reload configuration
SELECT pg_reload_conf();

-- Verify logging settings
SHOW log_min_duration_statement;
SHOW log_connections;
SHOW log_disconnections;
SHOW log_statement;
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET log_min_duration_statement = 0; ALTER SYSTEM SET log_connections = on; ALTER SYSTEM SET log_disconnections = on; ALTER SYSTEM SET log_statement = 'all'; ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '; SELECT pg_reload_conf(); SHOW log_min_duration_statement; SHOW log_connections; SHOW log_disconnections; SHOW log_statement;"]]{{RUN}}

**Create security audit view**:
```sql
CREATE OR REPLACE VIEW security_audit AS
SELECT 
    now() AS audit_timestamp,
    pid,
    usesysid,
    usename,
    application_name,
    client_addr,
    state,
    backend_start,
    query_start,
    state_change,
    LEFT(query, 200) AS query_preview
FROM pg_stat_activity
WHERE state = 'active'
    AND (query ILIKE '%password%'
         OR query ILIKE '%DROP%'
         OR query ILIKE '%DELETE%'
         OR query ILIKE '%UPDATE%'
         OR query ILIKE '%GRANT%'
         OR query ILIKE '%REVOKE%');

SELECT * FROM security_audit;
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE VIEW security_audit AS SELECT now() AS audit_timestamp, pid, usesysid, usename, application_name, client_addr, state, backend_start, query_start, state_change, LEFT(query, 200) AS query_preview FROM pg_stat_activity WHERE state = 'active' AND (query ILIKE '%password%' OR query ILIKE '%DROP%' OR query ILIKE '%DELETE%' OR query ILIKE '%UPDATE%' OR query ILIKE '%GRANT%' OR query ILIKE '%REVOKE%'); SELECT * FROM security_audit;"]]{{RUN}}

**Create audit function for sensitive operations**:
```sql
CREATE OR REPLACE FUNCTION log_sensitive_operation()
RETURNS TRIGGER AS $$
BEGIN
    -- Log sensitive operation
    RAISE NOTICE 'SENSITIVE OPERATION: % by user % at %',
        TG_OP,
        current_user,
        now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit table
CREATE TABLE audit_log (
    audit_id SERIAL PRIMARY KEY,
    operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operation_type VARCHAR(20),
    table_name VARCHAR(100),
    user_name VARCHAR(100),
    old_data JSONB,
    new_data JSONB
);

-- Create trigger for sensitive table
CREATE TRIGGER audit_tenant_data
AFTER INSERT OR UPDATE OR DELETE ON tenant_data
FOR EACH ROW EXECUTE FUNCTION log_sensitive_operation();
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE FUNCTION log_sensitive_operation() RETURNS TRIGGER AS \$\$ BEGIN RAISE NOTICE 'SENSITIVE OPERATION: % by user % at %', TG_OP, current_user, now(); RETURN NEW; END; \$\$ LANGUAGE plpgsql; CREATE TABLE audit_log (audit_id SERIAL PRIMARY KEY, operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, operation_type VARCHAR(20), table_name VARCHAR(100), user_name VARCHAR(100), old_data JSONB, new_data JSONB); CREATE TRIGGER audit_tenant_data AFTER INSERT OR UPDATE OR DELETE ON tenant_data FOR EACH ROW EXECUTE FUNCTION log_sensitive_operation();"]]{{RUN}}

**Test audit logging**:
```sql
-- Perform sensitive operations
INSERT INTO tenant_data (id, tenant_id, user_id, data, sensitivity_level)
VALUES (999999, 1, 100, 'Test sensitive data', 'confidential');

UPDATE tenant_data SET data = 'Updated' WHERE id = 999999;
```

[[gsql -d postgres -p 5432 -c "INSERT INTO tenant_data (id, tenant_id, user_id, data, sensitivity_level) VALUES (999999, 1, 100, 'Test sensitive data', 'confidential'); UPDATE tenant_data SET data = 'Updated' WHERE id = 999999;"]]{{RUN}}

**What to observe**:
- Comprehensive logging provides security visibility
- Logging all statements has performance overhead
- Selective logging balances security and performance

---

### Task 5: Security Performance Optimization

Optimize security features while maintaining security posture.

**Create optimized RLS policies**:
```sql
-- Create indexed function for RLS performance
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS INT AS $$
    SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id();
$$ LANGUAGE SQL STABLE;

-- Create optimized RLS policy using indexed function
DROP POLICY IF EXISTS tenant_isolation ON tenant_data;
CREATE POLICY tenant_isolation_optimized
ON tenant_data
FOR ALL
TO PUBLIC
USING (tenant_id = get_user_tenant_id());

-- Test optimized policy performance
EXPLAIN ANALYZE
SELECT COUNT(*) FROM tenant_data;
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE FUNCTION get_user_tenant_id() RETURNS INT AS \$\$ SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id(); \$\$ LANGUAGE SQL STABLE; DROP POLICY IF EXISTS tenant_isolation ON tenant_data; CREATE POLICY tenant_isolation_optimized ON tenant_data FOR ALL TO PUBLIC USING (tenant_id = get_user_tenant_id()); EXPLAIN ANALYZE SELECT COUNT(*) FROM tenant_data;"]]{{RUN}}

**Create caching layer for repeated security checks**:
```sql
-- Create session cache for security context
CREATE TABLE security_cache (
    session_id TEXT PRIMARY KEY,
    user_id INT,
    tenant_id INT,
    role VARCHAR(20),
    cache_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to use cache
CREATE OR REPLACE FUNCTION get_cached_tenant_id()
RETURNS INT AS $$
DECLARE
    cached_record RECORD;
BEGIN
    -- Check cache
    SELECT * INTO cached_record 
    FROM security_cache 
    WHERE session_id = current_setting('application_name');
    
    IF FOUND THEN
        RETURN cached_record.tenant_id;
    END IF;
    
    -- Cache miss - fetch and cache
    INSERT INTO security_cache (session_id, user_id, tenant_id, role)
    SELECT 
        current_setting('application_name'),
        current_user_id(),
        tenant_id,
        role
    FROM tenant_users
    WHERE user_id = current_user_id();
    
    RETURN (SELECT tenant_id FROM security_cache 
            WHERE session_id = current_setting('application_name'));
END;
$$ LANGUAGE plpgsql;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE security_cache (session_id TEXT PRIMARY KEY, user_id INT, tenant_id INT, role VARCHAR(20), cache_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE OR REPLACE FUNCTION get_cached_tenant_id() RETURNS INT AS \$\$ DECLARE cached_record RECORD; BEGIN SELECT * INTO cached_record FROM security_cache WHERE session_id = current_setting('application_name'); IF FOUND THEN RETURN cached_record.tenant_id; END IF; INSERT INTO security_cache (session_id, user_id, tenant_id, role) SELECT current_setting('application_name'), current_user_id(), tenant_id, role FROM tenant_users WHERE user_id = current_user_id(); RETURN (SELECT tenant_id FROM security_cache WHERE session_id = current_setting('application_name')); END; \$\$ LANGUAGE plpgsql;"]]{{RUN}}

**Optimize audit logging**:
```sql
-- Reduce audit logging overhead with conditional logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log only queries > 1 second
ALTER SYSTEM SET log_statement = 'mod';  -- Log only DDL and DML

-- Reload configuration
SELECT pg_reload_conf();
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET log_min_duration_statement = 1000; ALTER SYSTEM SET log_statement = 'mod'; SELECT pg_reload_conf();"]]{{RUN}}

**What to observe**:
- Cached security checks reduce repeated lookups
- Conditional logging reduces performance overhead
- Optimization must maintain security effectiveness

---

### Task 6: Security Monitoring Dashboard

Create comprehensive security monitoring with alerts.

**Create security health check function**:
```sql
CREATE OR REPLACE FUNCTION security_health_check()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    value TEXT,
    threshold TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Check for users with superuser privileges
    SELECT 
        'Superuser Count',
        CASE WHEN COUNT(*) < 3 THEN 'OK' ELSE 'WARNING' END,
        COUNT(*)::TEXT,
        '< 3'
    FROM pg_user
    WHERE usesuper = true
    
    UNION ALL
    
    -- Check for users with password expiration disabled
    SELECT 
        'Password Expiration',
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END,
        COUNT(*)::TEXT,
        '0'
    FROM pg_user
    WHERE passwdvaliduntil IS NULL
    
    UNION ALL
    
    -- Check for public schema privileges
    SELECT 
        'Public Schema Privileges',
        CASE WHEN COUNT(*) < 10 THEN 'OK' ELSE 'WARNING' END,
        COUNT(*)::TEXT,
        '< 10'
    FROM information_schema.role_table_grants
    WHERE grantee = 'PUBLIC';
END;
$$ LANGUAGE plpgsql;

SELECT * FROM security_health_check();
```

[[gsql -d postgres -p 5432 -c "CREATE OR REPLACE FUNCTION security_health_check() RETURNS TABLE (check_name TEXT, status TEXT, value TEXT, threshold TEXT) AS \$\$ BEGIN RETURN QUERY SELECT 'Superuser Count', CASE WHEN COUNT(*) < 3 THEN 'OK' ELSE 'WARNING' END, COUNT(*)::TEXT, '< 3' FROM pg_user WHERE usesuper = true UNION ALL SELECT 'Password Expiration', CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END, COUNT(*)::TEXT, '0' FROM pg_user WHERE passwdvaliduntil IS NULL UNION ALL SELECT 'Public Schema Privileges', CASE WHEN COUNT(*) < 10 THEN 'OK' ELSE 'WARNING' END, COUNT(*)::TEXT, '< 10' FROM information_schema.role_table_grants WHERE grantee = 'PUBLIC'; END; \$\$ LANGUAGE plpgsql; SELECT * FROM security_health_check();"]]{{RUN}}

**Create security event monitoring**:
```sql
CREATE TABLE security_events (
    event_id SERIAL PRIMARY KEY,
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    source_ip VARCHAR(50),
    user_name VARCHAR(100),
    details JSONB
);

-- Create alert threshold table
CREATE TABLE security_alert_thresholds (
    event_type VARCHAR(50) PRIMARY KEY,
    warning_threshold INT,
    critical_threshold INT,
    time_window_minutes INT
);

INSERT INTO security_alert_thresholds VALUES
('failed_login', 5, 10, 5),
('sensitive_data_access', 10, 20, 10),
('privilege_escalation', 1, 1, 60);

SELECT * FROM security_alert_thresholds;
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE security_events (event_id SERIAL PRIMARY KEY, event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, event_type VARCHAR(50), severity VARCHAR(20), description TEXT, source_ip VARCHAR(50), user_name VARCHAR(100), details JSONB); CREATE TABLE security_alert_thresholds (event_type VARCHAR(50) PRIMARY KEY, warning_threshold INT, critical_threshold INT, time_window_minutes INT); INSERT INTO security_alert_thresholds VALUES ('failed_login', 5, 10, 5), ('sensitive_data_access', 10, 20, 10), ('privilege_escalation', 1, 1, 60); SELECT * FROM security_alert_thresholds;"]]{{RUN}}

**What to observe**:
- Security monitoring provides visibility into security posture
- Alert thresholds enable proactive response
- Automated monitoring reduces manual oversight

---

### Task 7: Clean Up Test Environment

**Drop test tables and functions**:
```sql
-- Drop test tables
DROP TABLE IF EXISTS security_perf_test CASCADE;
DROP TABLE IF EXISTS tenant_data CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS tenant_users CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS security_cache CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS security_alert_thresholds CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_tenant_id();
DROP FUNCTION IF EXISTS get_cached_tenant_id();
DROP FUNCTION IF EXISTS log_sensitive_operation();
DROP FUNCTION IF EXISTS security_health_check();

-- Drop views
DROP VIEW IF EXISTS security_audit;

-- Drop test users
DROP USER IF EXISTS auth_test_md5;
DROP USER IF EXISTS auth_test_scram;
DROP USER IF EXISTS auth_test_cert;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE IF EXISTS security_perf_test CASCADE; DROP TABLE IF EXISTS tenant_data CASCADE; DROP TABLE IF EXISTS tenants CASCADE; DROP TABLE IF EXISTS tenant_users CASCADE; DROP TABLE IF EXISTS audit_log CASCADE; DROP TABLE IF EXISTS security_cache CASCADE; DROP TABLE IF EXISTS security_events CASCADE; DROP TABLE IF EXISTS security_alert_thresholds CASCADE; DROP FUNCTION IF EXISTS get_user_tenant_id(); DROP FUNCTION IF EXISTS get_cached_tenant_id(); DROP FUNCTION IF EXISTS log_sensitive_operation(); DROP FUNCTION IF EXISTS security_health_check(); DROP VIEW IF EXISTS security_audit; DROP USER IF EXISTS auth_test_md5; DROP USER IF EXISTS auth_test_scram; DROP USER IF EXISTS auth_test_cert;"]]{{RUN}}

**Clean up scripts**:
```bash
# Remove test scripts
rm -f /tmp/ldap_auth_setup.sh

# Verify cleanup
echo "Test files removed:"
ls -la /tmp/*.sh 2>/dev/null || echo "No test scripts found"
```

[[bash -c "rm -f /tmp/ldap_auth_setup.sh && echo \"Test files removed:\" && ls -la /tmp/*.sh 2>/dev/null || echo \"No test scripts found\""]]{{RUN}}

**What to observe**:
- Clean up prevents security exposure
- Removing test accounts reduces attack surface
- Proper cleanup is essential for security

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Measured performance impact of security features
- [ ] Task 2: Configured advanced authentication methods
- [ ] Task 3: Implemented fine-grained access control with RLS
- [ ] Task 4: Set up comprehensive security auditing
- [ ] Task 5: Optimized security for performance
- [ ] Task 6: Created security monitoring dashboard
- [ ] Task 7: Cleaned up test environment

## Review Questions

1. **What is performance impact of RLS?**
   - [ ] No impact
   - [ ] Adds query overhead
   - [ ] Improves performance
   - [ ] Only affects writes

2. **Which authentication is most secure?**
   - [ ] trust
   - [ ] password (md5)
   - [ ] scram-sha-256
   - [ ] All equally secure

3. **What does security auditing do?**
   - [ ] Encrypts data
   - [ ] Logs security-relevant events
   - [ ] Blocks attacks
   - [ ] Compresses data

4. **How to optimize security performance?**
   - [ ] Disable all security features
   - [ ] Use caching and selective logging
   - [ ] Increase hardware
   - [ ] Use simpler passwords

## Summary

In this L3 lab, you practiced:
- **Security Performance**: Understanding overhead of security features
- **Advanced Authentication**: Multiple methods and trade-offs
- **Fine-Grained Control**: Complex RLS policies
- **Security Auditing**: Comprehensive monitoring and logging
- **Optimization**: Balancing security and performance
- **Monitoring**: Security health checks and alerts

These advanced security techniques enable you to implement robust security while maintaining acceptable performance in GaussDB.

## Next Steps

Proceed to **L4 Lab** to practice expert-level operations including:
- Complex security architectures
- Zero-trust network implementation
- Advanced threat detection
- Security automation
- Compliance management
