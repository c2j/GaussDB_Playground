# Architecture Module - L1 Lab: Basic GaussDB Architecture

## Lab Overview

In this L1 (Entry Level) lab, you will explore the basic architecture of GaussDB, including:
- Viewing active database processes
- Monitoring database connections
- Checking memory configuration
- Understanding process model components

**Time Required**: 15 minutes
**Prerequisites**: GaussDB running with gsql client available

## Learning Objectives

By completing this lab, you will be able to:
- Identify and describe the key GaussDB processes
- Query current database connection information
- Check shared memory configuration
- Use basic gsql commands to inspect system state

## Lab Tasks

### Task 1: View Active GaussDB Processes

Let's examine the running GaussDB processes to understand the process model.

**Command to run**:
```bash
ps aux | grep gaussdb
```

[[ps aux | grep gaussdb]]{{RUN}}

**What to observe**:
- **postmaster**: The main parent process (PID 1)
- **postgres**: One or more worker processes handling client connections
- **bgwriter**: Background writer process for checkpoint operations
- **walwriter**: WAL (Write-Ahead Log) writer process
- **autovacuum**: Automatic vacuum process for cleaning dead tuples

**Verification Question**:
How many gaussdb processes are currently running? Count them from the output.

---

### Task 2: Check Current Database Connections

Let's query the number of active database connections.

**Command to run**:
```sql
SELECT count(*) AS total_connections FROM pg_stat_activity;
```

[[gsql -d postgres -p 5432 -c "SELECT count(*) AS total_connections FROM pg_stat_activity;"]]{{RUN}}

**What to observe**:
- The result shows the total number of connections
- This includes both active and idle connections

**Verification Query**:
Let's see the details of each connection:

```sql
SELECT 
    datname AS database_name,
    usename AS user_name,
    application_name,
    state,
    query_start,
    state_change
FROM pg_stat_activity
ORDER BY state_change DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT datname AS database_name, usename AS user_name, application_name, state, query_start, state_change FROM pg_stat_activity ORDER BY state_change DESC;"]]{{RUN}}

**Key Points**:
- **active**: Connection is currently executing a query
- **idle**: Connection is waiting for a new query
- **idle in transaction**: Connection is in a transaction but not executing a query

---

### Task 3: Examine Shared Memory Configuration

Shared memory is a critical component of GaussDB architecture. Let's check its configuration.

**Command to run**:
```sql
SHOW shared_buffers;
```

[[gsql -d postgres -p 5432 -c "SHOW shared_buffers;"]]{{RUN}}

**What to observe**:
- This shows the amount of memory allocated to the shared buffer cache
- Typical value is 25-40% of system RAM in production environments

**Additional Memory Parameters**:
Let's check other important memory settings:

```sql
SELECT name, 
       setting, 
       unit, 
       short_desc
FROM pg_settings
WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem', 'temp_buffers')
ORDER BY name;
```

[[gsql -d postgres -p 5432 -c "SELECT name, setting, unit, short_desc FROM pg_settings WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem', 'temp_buffers') ORDER BY name;"]]{{RUN}}

**Parameter Explanations**:
- **shared_buffers**: Shared memory for data page caching (system-wide)
- **work_mem**: Memory for sorting/hashing operations (per operation)
- **maintenance_work_mem**: Memory for VACUUM, CREATE INDEX (per maintenance operation)
- **temp_buffers**: Memory for temporary tables (per session)

---

### Task 4: Monitor Background Processes

Let's query background process activity.

**Command to run**:
```sql
SELECT 
    count(*) AS autovacuum_workers
FROM pg_stat_activity
WHERE backend_type = 'autovacuum worker';
```

[[gsql -d postgres -p 5432 -c "SELECT count(*) AS autovacuum_workers FROM pg_stat_activity WHERE backend_type = 'autovacuum worker';"]]{{RUN}}

**Verification**:
Check for other background process types:

```sql
SELECT 
    backend_type,
    count(*) AS count
FROM pg_stat_activity
GROUP BY backend_type
ORDER BY count DESC;
```

[[gsql -d postgres -p 5432 -c "SELECT backend_type, count(*) AS count FROM pg_stat_activity GROUP BY backend_type ORDER BY count DESC;"]]{{RUN}}

**Common backend types**:
- **client backend**: Regular user connections
- **autovacuum worker**: Background cleanup processes
- **autovacuum launcher**: Process that launches autovacuum workers
- **background worker**: Other background maintenance tasks

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Viewed and identified gaussdb processes
- [ ] Task 2: Queried database connections and understood states
- [ ] Task 3: Examined shared memory and related parameters
- [ ] Task 4: Monitored background process activity

## Review Questions

1. **What is the role of the postmaster process?**
   - [ ] It handles client queries
   - [ ] It manages all child processes
   - [ ] It writes WAL logs
   - [ ] It performs autovacuum

2. **What does shared_buffers parameter control?**
   - [ ] Temporary table storage
   - [ ] Sort operations memory
   - [ ] Shared data page cache
   - [ ] Maintenance operation memory

3. **What is the difference between 'active' and 'idle' connection states?**
   - [ ] No difference
   - [ ] Active is running a query, idle is waiting
   - [ ] Active is idle, idle is running
   - [ ] Active uses more memory

## Summary

In this L1 lab, you explored:
- **Process Model**: Identified postmaster, postgres, bgwriter, walwriter, and autovacuum processes
- **Connection Monitoring**: Queried active connections using `pg_stat_activity`
- **Memory Architecture**: Examined shared_buffers and other memory parameters
- **Background Processes**: Monitored autovacuum and other background workers

These basic operations form the foundation for understanding GaussDB's multi-process architecture.

## Next Steps

Proceed to **L2 Lab** to practice intermediate operations including:
- Analyzing process statistics in detail
- Monitoring memory usage patterns
- Configuring basic memory parameters
- Understanding checkpoint and WAL operations
