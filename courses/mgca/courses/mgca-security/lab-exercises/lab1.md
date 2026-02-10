# Security Module - L1 Lab: Basic Security Operations

## Lab Overview

In this L1 (Entry Level) lab, you will practice basic security operations in GaussDB, including:
- Creating database users and roles
- Granting and revoking privileges
- Checking user permissions
- Understanding basic security concepts

**Time Required**: 25 minutes
**Prerequisites**: GaussDB running with gsql client available

## Learning Objectives

By completing this lab, you will be able to:
- Create users and roles with appropriate permissions
- Grant object and database-level privileges
- Check and review user permissions
- Understand basic security best practices

## Lab Tasks

### Task 1: Create Database Users and Roles

Let's create different users for various database operations.

**Create a read-only user**:
```sql
CREATE USER readonly_user WITH PASSWORD 'Read0nly!';
```

[[gsql -d postgres -p 5432 -c "CREATE USER readonly_user WITH PASSWORD 'Read0nly!';"]]{{RUN}}

**Create a read-write user**:
```sql
CREATE USER readwrite_user WITH PASSWORD 'Wr1teR3ad!';
```

[[gsql -d postgres -p 5432 -c "CREATE USER readwrite_user WITH PASSWORD 'Wr1teR3ad!';"]]{{RUN}}

**Create an admin role**:
```sql
CREATE ROLE admin_role WITH LOGIN PASSWORD 'Adm1nStr0ng!' SUPERUSER;
```

[[gsql -d postgres -p 5432 -c "CREATE ROLE admin_role WITH LOGIN PASSWORD 'Adm1nStr0ng!' SUPERUSER;"]]{{RUN}}

**Verify users created**:
```sql
SELECT 
    usename AS username,
    usecreatedb AS can_create_db,
    usesuper AS is_superuser,
    usecreaterole AS can_create_role
FROM pg_user
WHERE usename IN ('readonly_user', 'readwrite_user', 'admin_role')
ORDER BY usename;
```

[[gsql -d postgres -p 5432 -c "SELECT usename AS username, usecreatedb AS can_create_db, usesuper AS is_superuser, usecreaterole AS can_create_role FROM pg_user WHERE usename IN ('readonly_user', 'readwrite_user', 'admin_role') ORDER BY usename;"]]{{RUN}}

---

### Task 2: Grant Database-Level Privileges

Let's grant database-level privileges to the users.

**Grant CONNECT privilege to all users**:
```sql
GRANT CONNECT ON DATABASE postgres TO readonly_user, readwrite_user;
```

[[gsql -d postgres -p 5432 -c "GRANT CONNECT ON DATABASE postgres TO readonly_user, readwrite_user;"]]{{RUN}}

**Grant TEMP (temporary table) privilege**:
```sql
GRANT TEMP ON DATABASE postgres TO readwrite_user;
```

[[gsql -d postgres -p 5432 -c "GRANT TEMP ON DATABASE postgres TO readwrite_user;"]]{{RUN}}

**Grant schema usage**:
```sql
GRANT USAGE ON SCHEMA public TO readonly_user, readwrite_user;
```

[[gsql -d postgres -p 5432 -c "GRANT USAGE ON SCHEMA public TO readonly_user, readwrite_user;"]]{{RUN}}

**Verify privileges**:
```sql
SELECT 
    grantee,
    privilege_type
FROM pg_hba_file_rules
WHERE grantee IN ('readonly_user', 'readwrite_user')
ORDER BY grantee, privilege_type;
```

[[gsql -d postgres -p 5432 -c "SELECT grantee, privilege_type FROM pg_hba_file_rules WHERE grantee IN ('readonly_user', 'readwrite_user') ORDER BY grantee, privilege_type;"]]{{RUN}}

---

### Task 3: Create Test Tables and Grant Object Privileges

Let's create test tables and grant appropriate privileges.

**Create a test table**:
```sql
CREATE TABLE security_test (
    id INT PRIMARY KEY,
    data TEXT,
    sensitive_data TEXT
);

INSERT INTO security_test VALUES 
    (1, 'Public data', 'Sensitive information'),
    (2, 'Another record', 'More sensitive data');
```

[[gsql -d postgres -p 5432 -c "CREATE TABLE security_test (id INT PRIMARY KEY, data TEXT, sensitive_data TEXT); INSERT INTO security_test VALUES (1, 'Public data', 'Sensitive information'), (2, 'Another record', 'More sensitive data');"]]{{RUN}}

**Grant SELECT privilege to read-only user**:
```sql
GRANT SELECT ON security_test TO readonly_user;
```

[[gsql -d postgres -p 5432 -c "GRANT SELECT ON security_test TO readonly_user;"]]{{RUN}}

**Grant full privileges to read-write user**:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON security_test TO readwrite_user;
```

[[gsql -d postgres -p 5432 -c "GRANT SELECT, INSERT, UPDATE, DELETE ON security_test TO readwrite_user;"]]{{RUN}}

**Verify table privileges**:
```sql
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'security_test'
    AND grantee IN ('readonly_user', 'readwrite_user')
ORDER BY grantee, privilege_type;
```

[[gsql -d postgres -p 5432 -c "SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'security_test' AND grantee IN ('readonly_user', 'readwrite_user') ORDER BY grantee, privilege_type;"]]{{RUN}}

---

### Task 4: Test User Permissions

Let's test the permissions by connecting as different users.

**Test as read-only user**:
```sql
SET ROLE readonly_user;
SELECT * FROM security_test;
```

[[gsql -d postgres -p 5432 -c "SET ROLE readonly_user; SELECT * FROM security_test;"]]{{RUN}}

**Attempt to insert as read-only user (should fail)**:
```sql
SET ROLE readonly_user;
INSERT INTO security_test VALUES (3, 'Test', 'Test');
```

[[gsql -d postgres -p 5432 -c "SET ROLE readonly_user; INSERT INTO security_test VALUES (3, 'Test', 'Test');"]]{{RUN}}

**Expected**: ERROR: permission denied for table security_test

**Test as read-write user**:
```sql
SET ROLE readwrite_user;
INSERT INTO security_test VALUES (3, 'New data', 'New sensitive');
SELECT * FROM security_test ORDER BY id;
```

[[gsql -d postgres -p 5432 -c "SET ROLE readwrite_user; INSERT INTO security_test VALUES (3, 'New data', 'New sensitive'); SELECT * FROM security_test ORDER BY id;"]]{{RUN}}

**Reset to superuser**:
```sql
RESET ROLE;
```

[[gsql -d postgres -p 5432 -c "RESET ROLE;"]]{{RUN}}

---

### Task 5: Revoke Privileges

Let's practice revoking privileges when access is no longer needed.

**Revoke INSERT privilege from read-write user**:
```sql
REVOKE INSERT ON security_test FROM readwrite_user;
```

[[gsql -d postgres -p 5432 -c "REVOKE INSERT ON security_test FROM readwrite_user;"]]{{RUN}}

**Verify revocation**:
```sql
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'security_test'
    AND grantee = 'readwrite_user'
ORDER BY privilege_type;
```

[[gsql -d postgres -p 5432 -c "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'security_test' AND grantee = 'readwrite_user' ORDER BY privilege_type;"]]{{RUN}}

**Test insertion after revocation (should fail)**:
```sql
SET ROLE readwrite_user;
INSERT INTO security_test VALUES (4, 'Test', 'Test');
```

[[gsql -d postgres -p 5432 -c "SET ROLE readwrite_user; INSERT INTO security_test VALUES (4, 'Test', 'Test');"]]{{RUN}}

**Expected**: ERROR: permission denied for table security_test

---

### Task 6: Create Role Hierarchy

Let's create role hierarchy for easier permission management.

**Create department roles**:
```sql
CREATE ROLE sales_dept WITH NOLOGIN;
CREATE ROLE it_dept WITH NOLOGIN;
```

[[gsql -d postgres -p 5432 -c "CREATE ROLE sales_dept WITH NOLOGIN; CREATE ROLE it_dept WITH NOLOGIN;"]]{{RUN}}

**Create users and assign to departments**:
```sql
CREATE USER alice WITH PASSWORD 'Al1ceP@ss!';
CREATE USER bob WITH PASSWORD 'B0bP@ss!';

GRANT sales_dept TO alice;
GRANT it_dept TO bob;
```

[[gsql -d postgres -p 5432 -c "CREATE USER alice WITH PASSWORD 'Al1ceP@ss!'; CREATE USER bob WITH PASSWORD 'B0bP@ss!'; GRANT sales_dept TO alice; GRANT it_dept TO bob;"]]{{RUN}}

**Grant privileges to department roles**:
```sql
GRANT SELECT ON security_test TO sales_dept;
GRANT SELECT, UPDATE ON security_test TO it_dept;
```

[[gsql -d postgres -p 5432 -c "GRANT SELECT ON security_test TO sales_dept; GRANT SELECT, UPDATE ON security_test TO it_dept;"]]{{RUN}}

**Test role hierarchy**:
```sql
SET ROLE alice;
SELECT * FROM security_test;
UPDATE security_test SET data = 'Test' WHERE id = 1;
```

[[gsql -d postgres -p 5432 -c "SET ROLE alice; SELECT * FROM security_test; UPDATE security_test SET data = 'Test' WHERE id = 1;"]]{{RUN}}

**Expected**: SELECT succeeds, UPDATE fails

```sql
RESET ROLE;
SET ROLE bob;
SELECT * FROM security_test;
UPDATE security_test SET data = 'Updated by IT' WHERE id = 1;
```

[[gsql -d postgres -p 5432 -c "RESET ROLE; SET ROLE bob; SELECT * FROM security_test; UPDATE security_test SET data = 'Updated by IT' WHERE id = 1;"]]{{RUN}}

**Expected**: Both SELECT and UPDATE succeed

---

### Task 7: Check and Review Permissions

Let's review all permissions in the database.

**Check all granted privileges**:
```sql
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY grantee, table_name, privilege_type;
```

[[gsql -d postgres -p 5432 -c "SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public' ORDER BY grantee, table_name, privilege_type;"]]{{RUN}}

**Check user role memberships**:
```sql
SELECT 
    r.rolname AS role_name,
    m.rolname AS member_name
FROM pg_auth_members m
JOIN pg_roles r ON m.roleid = r.oid
ORDER BY role_name, member_name;
```

[[gsql -d postgres -p 5432 -c "SELECT r.rolname AS role_name, m.rolname AS member_name FROM pg_auth_members m JOIN pg_roles r ON m.roleid = r.oid ORDER BY role_name, member_name;"]]{{RUN}}

**Check database-level privileges**:
```sql
SELECT 
    datname AS database_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
UNION ALL
SELECT 
    datname,
    grantee,
    privilege_type
FROM pg_database
WHERE datname = 'postgres';
```

[[gsql -d postgres -p 5432 -c "SELECT datname AS database_name, grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public' UNION ALL SELECT datname, grantee, privilege_type FROM pg_database WHERE datname = 'postgres';"]]{{RUN}}

---

### Task 8: Clean Up Test Objects

Let's clean up the test objects created during this lab.

**Drop test table**:
```sql
DROP TABLE security_test;
```

[[gsql -d postgres -p 5432 -c "DROP TABLE security_test;"]]{{RUN}}

**Drop test users and roles**:
```sql
DROP USER readonly_user;
DROP USER readwrite_user;
DROP USER alice;
DROP USER bob;
DROP ROLE admin_role;
DROP ROLE sales_dept;
DROP ROLE it_dept;
```

[[gsql -d postgres -p 5432 -c "DROP USER readonly_user; DROP USER readwrite_user; DROP USER alice; DROP USER bob; DROP ROLE admin_role; DROP ROLE sales_dept; DROP ROLE it_dept;"]]{{RUN}}

**Verify cleanup**:
```sql
SELECT usename 
FROM pg_user 
WHERE usename IN ('readonly_user', 'readwrite_user', 'alice', 'bob', 'admin_role');
```

[[gsql -d postgres -p 5432 -c "SELECT usename FROM pg_user WHERE usename IN ('readonly_user', 'readwrite_user', 'alice', 'bob', 'admin_role');"]]{{RUN}}

**Expected**: No results (all users dropped)

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Created users and roles with different permission levels
- [ ] Task 2: Granted database-level privileges (CONNECT, TEMP)
- [ ] Task 3: Created test tables and granted object privileges
- [ ] Task 4: Tested user permissions (read-only and read-write)
- [ ] Task 5: Revoked privileges and verified revocation
- [ ] Task 6: Created role hierarchy with department roles
- [ ] Task 7: Reviewed all permissions in the database
- [ ] Task 8: Cleaned up test objects

## Review Questions

1. **What is the difference between a USER and a ROLE in GaussDB?**
   - [ ] No difference
   - [ ] USER can login, ROLE cannot (unless WITH LOGIN)
   - [ ] ROLE can login, USER cannot
   - [ ] USER has more privileges

2. **Which command grants SELECT privilege on a table to a user?**
   - [ ] GIVE SELECT ON table TO user
   - [ ] ALLOW SELECT ON table TO user
   - [ ] GRANT SELECT ON table TO user
   - [ ] PERMIT SELECT ON table TO user

3. **What happens when you grant privileges to a role that users inherit?**
   - [ ] Users get the privileges automatically
   - [ ] Users must be granted explicitly
   - [ ] Nothing happens
   - [ ] Privileges are lost

4. **How do you revoke a previously granted privilege?**
   - [ ] DELETE privilege
   - [ ] REMOVE privilege
   - [ ] REVOKE privilege
   - [ ] CANCEL privilege

## Summary

In this L1 lab, you practiced:
- **User Management**: Creating users and roles with different privilege levels
- **Privilege Granting**: Granting CONNECT, TEMP, SELECT, INSERT, UPDATE, DELETE
- **Privilege Revocation**: Removing privileges with REVOKE
- **Permission Testing**: Verifying permissions by connecting as different users
- **Role Hierarchy**: Creating department roles and assigning users to them
- **Permission Review**: Querying system catalogs to review all granted privileges
- **Cleanup**: Dropping test users, roles, and tables

These basic security operations are essential for managing access control in GaussDB.

## Security Best Practices

1. **Principle of Least Privilege**: Grant only the minimum permissions needed
2. **Use Roles**: Manage groups of users with roles instead of individual grants
3. **Regular Audits**: Review permissions regularly and revoke unnecessary access
4. **Strong Passwords**: Use complex passwords for all database users
5. **Avoid Superuser**: Use SUPERUSER privilege only for administrative tasks

## Next Steps

Proceed to **L2 Lab** to practice intermediate security operations including:
- Configuring row-level security (RLS)
- Implementing data masking
- Configuring SSL/TLS encryption
- Setting up audit logging
- Managing encryption at rest
