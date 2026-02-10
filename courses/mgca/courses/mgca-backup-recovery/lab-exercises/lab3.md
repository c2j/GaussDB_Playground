# Backup and Recovery Module - L3 Lab: Advanced Backup and Recovery Strategies

## Lab Overview

In this L3 (Advanced Level) lab, you will practice advanced backup and recovery techniques in GaussDB, including:
- Parallel backup strategies for large databases
- Incremental backup optimization
- Point-in-time recovery (PITR) scenarios
- Backup compression and deduplication
- Cross-region backup and recovery

**Time Required**: 55 minutes
**Prerequisites**: Completed L1 and L2 Backup/Recovery Labs, sufficient disk space

## Learning Objectives

By completing this lab, you will be able to:
- Implement parallel backups for large databases
- Optimize incremental backup performance
- Perform complex point-in-time recovery scenarios
- Use compression and deduplication for efficient storage
- Plan and execute cross-region backup strategies

## Lab Tasks

### Task 1: Parallel Backup Strategy

Use parallel backup for faster backup of large databases.

**Create large test database**:
```sql
CREATE DATABASE backup_test_db;
\c backup_test_db

CREATE TABLE large_table (
    id INT PRIMARY KEY,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert large amount of data
INSERT INTO large_table
SELECT 
    generate_series(1, 500000),
    repeat('Data for backup test ', 100) || generate_series(1, 500000),
    CURRENT_TIMESTAMP - (random() * 365 * 24 * 3600)::interval;

-- Verify table size
SELECT 
    pg_size_pretty(pg_total_relation_size('large_table')) AS table_size;
```

[[gsql -d postgres -p 5432 -c "CREATE DATABASE backup_test_db; \\c backup_test_db CREATE TABLE large_table (id INT PRIMARY KEY, data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO large_table SELECT generate_series(1, 500000), repeat('Data for backup test ', 100) || generate_series(1, 500000), CURRENT_TIMESTAMP - (random() * 365 * 24 * 3600)::interval; SELECT pg_size_pretty(pg_total_relation_size('large_table')) AS table_size;"]]{{RUN}}

**Standard single-thread backup**:
```bash
# Measure time for single-thread backup
time gs_dump -h localhost -p 5432 -U postgres backup_test_db -f backup_single.sql
```

[[bash -c "time gs_dump -h localhost -p 5432 -U postgres backup_test_db -f /tmp/backup_single.sql"]]{{RUN}}

**Parallel backup with multiple jobs**:
```bash
# Parallel backup using -j flag
time gs_dump -h localhost -p 5432 -U postgres -j 4 backup_test_db -f backup_parallel.sql

# Check file sizes
ls -lh /tmp/backup_single.sql /tmp/backup_parallel.sql
```

[[bash -c "time gs_dump -h localhost -p 5432 -U postgres -j 4 backup_test_db -f /tmp/backup_parallel.sql && ls -lh /tmp/backup_single.sql /tmp/backup_parallel.sql"]]{{RUN}}

**Parallel backup with directory format**:
```bash
# Directory format allows more parallelism
time gs_dump -h localhost -p 5432 -U postgres -j 8 -F d backup_test_db -f /tmp/backup_parallel_dir

# Check backup structure
ls -lh /tmp/backup_parallel_dir/
```

[[bash -c "time gs_dump -h localhost -p 5432 -U postgres -j 8 -F d backup_test_db -f /tmp/backup_parallel_dir && ls -lh /tmp/backup_parallel_dir/"]]{{RUN}}

**What to observe**:
- Parallel backup reduces backup time significantly
- Directory format (-F d) allows more parallelism
- More jobs (-j) may not always be better (diminishing returns)

---

### Task 2: Compressed Backup Optimization

Use compression to reduce backup size and network transfer time.

**Backup without compression**:
```bash
# Uncompressed backup
time gs_dump -h localhost -p 5432 -U postgres backup_test_db -f /tmp/backup_uncompressed.sql

# Check file size
ls -lh /tmp/backup_uncompressed.sql
```

[[bash -c "time gs_dump -h localhost -p 5432 -U postgres backup_test_db -f /tmp/backup_uncompressed.sql && ls -lh /tmp/backup_uncompressed.sql"]]{{RUN}}

**Backup with gs_dump compression**:
```bash
# Compressed with gs_dump -Z flag (0-9, higher = more compression)
time gs_dump -h localhost -p 5432 -U postgres -Z 6 backup_test_db -f /tmp/backup_compressed.sql

# Compare sizes
ls -lh /tmp/backup_uncompressed.sql /tmp/backup_compressed.sql

# Check compression ratio
echo "Compression ratio: $(echo "scale=2; $(stat -f%z /tmp/backup_compressed.sql) / $(stat -f%z /tmp/backup_uncompressed.sql) * 100" | bc)%"
```

[[bash -c "time gs_dump -h localhost -p 5432 -U postgres -Z 6 backup_test_db -f /tmp/backup_compressed.sql && ls -lh /tmp/backup_uncompressed.sql /tmp/backup_compressed.sql"]]{{RUN}}

**External compression with gzip**:
```bash
# Compress with gzip for maximum compression
time gs_dump -h localhost -p 5432 -U postgres backup_test_db | gzip > /tmp/backup_gzip.sql.gz

# Compare all methods
ls -lh /tmp/backup_*.sql* 2>/dev/null

# Decompression test
gunzip -t /tmp/backup_gzip.sql.gz
```

[[bash -c "time gs_dump -h localhost -p 5432 -U postgres backup_test_db | gzip > /tmp/backup_gzip.sql.gz && ls -lh /tmp/backup_*.sql* 2>/dev/null && gunzip -t /tmp/backup_gzip.sql.gz"]]{{RUN}}

**Custom compression level comparison**:
```bash
# Test different compression levels
for level in 1 3 6 9; do
    echo "Testing compression level: $level"
    time gs_dump -h localhost -p 5432 -U postgres -Z $level backup_test_db > /tmp/backup_level_$level.sql
    size=$(stat -f%z /tmp/backup_level_$level.sql)
    echo "Size: $size bytes"
done
```

[[bash -c "for level in 1 3 6 9; do echo \"Testing compression level: $level\"; time gs_dump -h localhost -p 5432 -U postgres -Z $level backup_test_db > /tmp/backup_level_$level.sql; size=$(stat -f%z /tmp/backup_level_$level.sql); echo \"Size: $size bytes\"; done"]]{{RUN}}

**What to observe**:
- Compression level 6 offers good balance
- Higher compression takes more time
- External gzip may achieve better compression

---

### Task 3: Incremental Backup with WAL Archiving

Set up efficient incremental backup strategy using WAL archiving.

**Check current WAL configuration**:
```sql
\c postgres
SHOW wal_level;
SHOW archive_mode;
SHOW archive_command;
```

[[gsql -d postgres -p 5432 -c "SHOW wal_level; SHOW archive_mode; SHOW archive_command;"]]{{RUN}}

**Enable WAL archiving**:
```bash
# Create archive directory
mkdir -p /tmp/wal_archive
chmod 700 /tmp/wal_archive

# Modify postgresql.conf to enable archiving
# (In production, edit postgresql.conf file)
# For this lab, we'll simulate archiving setup
echo "WAL archiving would be configured in postgresql.conf:"
echo "wal_level = replica"
echo "archive_mode = on"
echo "archive_command = 'cp %p /tmp/wal_archive/%f'"
```

[[bash -c "mkdir -p /tmp/wal_archive && chmod 700 /tmp/wal_archive && echo \"WAL archiving would be configured in postgresql.conf:\" && echo \"wal_level = replica\" && echo \"archive_mode = on\" && echo \"archive_command = 'cp %p /tmp/wal_archive/%f'\""]]{{RUN}}

**Take base backup**:
```bash
# Physical base backup
gs_basebackup -h localhost -p 5432 -U postgres -D /tmp/base_backup -F p -X stream -P -v

# Check backup size
du -sh /tmp/base_backup

# List WAL files needed for PITR
ls -lh /tmp/wal_archive/ 2>/dev/null | head -10
```

[[bash -c "gs_basebackup -h localhost -p 5432 -U postgres -D /tmp/base_backup -F p -X stream -P -v && du -sh /tmp/base_backup && ls -lh /tmp/wal_archive/ 2>/dev/null | head -10"]]{{RUN}}

**Generate WAL activity**:
```sql
\c backup_test_db

-- Generate WAL through transactions
BEGIN;
INSERT INTO large_table
SELECT 
    generate_series(500001, 550000),
    'WAL generation data ' || generate_series(500001, 550000),
    CURRENT_TIMESTAMP;
COMMIT;

-- More transactions for WAL generation
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..100 LOOP
        PERFORM pg_switch_wal();
        UPDATE large_table SET data = data || ' updated ' WHERE id = i;
    END LOOP;
END $$;
```

[[gsql -d postgres -p 5432 -c "\\c backup_test_db; BEGIN; INSERT INTO large_table SELECT generate_series(500001, 550000), 'WAL generation data ' || generate_series(500001, 550000), CURRENT_TIMESTAMP; COMMIT; DO \$\$ DECLARE i INT; BEGIN FOR i IN 1..100 LOOP PERFORM pg_switch_wal(); UPDATE large_table SET data = data || ' updated ' WHERE id = i; END LOOP; END \$\$;"]]{{RUN}}

**Check current WAL position**:
```sql
SELECT pg_current_wal_lsn() AS current_lsn;
```

[[gsql -d postgres -p 5432 -c "SELECT pg_current_wal_lsn() AS current_lsn;"]]{{RUN}}

**What to observe**:
- WAL archiving captures all changes
- Base backup + archived WAL = full recovery point
- WAL files grow with transaction volume

---

### Task 4: Point-in-Time Recovery (PITR) Scenarios

Perform recovery to specific points in time.

**Record important timestamps**:
```sql
-- Get current timestamp and LSN
\c backup_test_db
SELECT 
    CURRENT_TIMESTAMP AS recovery_timestamp_1,
    pg_current_wal_lsn() AS recovery_lsn_1;

-- Perform some data changes
DELETE FROM large_table WHERE id % 100 = 0;
UPDATE large_table SET data = 'Modified' WHERE id % 50 = 0;

SELECT 
    CURRENT_TIMESTAMP AS recovery_timestamp_2,
    pg_current_wal_lsn() AS recovery_lsn_2;

-- More changes
DELETE FROM large_table WHERE id % 200 = 0;
```

[[gsql -d postgres -p 5432 -c "\\c backup_test_db; SELECT CURRENT_TIMESTAMP AS recovery_timestamp_1, pg_current_wal_lsn() AS recovery_lsn_1; DELETE FROM large_table WHERE id % 100 = 0; UPDATE large_table SET data = 'Modified' WHERE id % 50 = 0; SELECT CURRENT_TIMESTAMP AS recovery_timestamp_2, pg_current_wal_lsn() AS recovery_lsn_2; DELETE FROM large_table WHERE id % 200 = 0;"]]{{RUN}}

**Check row count before recovery**:
```sql
SELECT COUNT(*) AS current_row_count FROM large_table;
```

[[gsql -d postgres -p 5432 -c "SELECT COUNT(*) AS current_row_count FROM large_table;"]]{{RUN}}

**Simulate PITR setup**:
```bash
# In real PITR, you would:
# 1. Stop the database
# 2. Create recovery.conf with target time
# 3. Start the database for recovery
# 4. Verify recovery
# 5. Switch out of recovery mode

# For this lab, we'll demonstrate the configuration
cat > /tmp/recovery.conf <<EOF
restore_command = 'cp /tmp/wal_archive/%f %p'
recovery_target_time = '2025-02-08 14:00:00'
EOF

echo "Recovery configuration would be placed in $PGDATA/recovery.conf"
cat /tmp/recovery.conf
```

[[bash -c "cat > /tmp/recovery.conf <<EOF
restore_command = 'cp /tmp/wal_archive/%f %p'
recovery_target_time = '2025-02-08 14:00:00'
EOF
echo \"Recovery configuration would be placed in \$PGDATA/recovery.conf\"
cat /tmp/recovery.conf"]]{{RUN}}

**Advanced PITR options**:
```bash
# Recovery to specific LSN
cat > /tmp/recovery_lsn.conf <<EOF
restore_command = 'cp /tmp/wal_archive/%f %p'
recovery_target_lsn = '0/3000000'
recovery_target_inclusive = true
EOF

# Recovery to transaction ID
cat > /tmp/recovery_xid.conf <<EOF
restore_command = 'cp /tmp/wal_archive/%f %p'
recovery_target_xid = '12345'
EOF

# Recovery with timeline
cat > /tmp/recovery_timeline.conf <<EOF
restore_command = 'cp /tmp/wal_archive/%f %p'
recovery_target_timeline = 'latest'
EOF

echo "Advanced PITR options:"
echo "LSN-based recovery:"; cat /tmp/recovery_lsn.conf
echo "XID-based recovery:"; cat /tmp/recovery_xid.conf
echo "Timeline-based recovery:"; cat /tmp/recovery_timeline.conf
```

[[bash -c "cat > /tmp/recovery_lsn.conf <<EOF
restore_command = 'cp /tmp/wal_archive/%f %p'
recovery_target_lsn = '0/3000000'
recovery_target_inclusive = true
EOF
cat > /tmp/recovery_xid.conf <<EOF
restore_command = 'cp /tmp/wal_archive/%f %p'
recovery_target_xid = '12345'
EOF
cat > /tmp/recovery_timeline.conf <<EOF
restore_command = 'cp /tmp/wal_archive/%f %p'
recovery_target_timeline = 'latest'
EOF
echo \"Advanced PITR options:\"
echo \"LSN-based recovery:\"; cat /tmp/recovery_lsn.conf
echo \"XID-based recovery:\"; cat /tmp/recovery_xid.conf
echo \"Timeline-based recovery:\"; cat /tmp/recovery_timeline.conf"]]{{RUN}}

**What to observe**:
- PITR allows recovery to exact moment
- Can recover by time, LSN, or transaction ID
- Recovery must be carefully planned and tested

---

### Task 5: Cross-Region Backup Strategy

Plan and simulate cross-region backup for disaster recovery.

**Design backup strategy**:
```bash
# Create regional backup directories
mkdir -p /tmp/backups/primary
mkdir -p /tmp/backups/secondary
mkdir -p /tmp/backups/offsite

echo "Cross-region backup strategy:"
echo "Primary region: /tmp/backups/primary"
echo "Secondary region: /tmp/backups/secondary"
echo "Offsite storage: /tmp/backups/offsite"
```

[[bash -c "mkdir -p /tmp/backups/primary /tmp/backups/secondary /tmp/backups/offsite && echo \"Cross-region backup strategy:\" && echo \"Primary region: /tmp/backups/primary\" && echo \"Secondary region: /tmp/backups/secondary\" && echo \"Offsite storage: /tmp/backups/offsite\""]]{{RUN}}

**Create automated backup script**:
```bash
cat > /tmp/backup_script.sh <<'SCRIPT'
#!/bin/bash

# Cross-region backup script
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="gaussdb_backup_${BACKUP_DATE}"

echo "Starting backup: ${BACKUP_NAME}"

# Primary backup (local)
gs_dump -h localhost -p 5432 -U postgres -Z 6 backup_test_db \
    -f /tmp/backups/primary/${BACKUP_NAME}.sql.gz

# Secondary backup (copy)
cp /tmp/backups/primary/${BACKUP_NAME}.sql.gz \
    /tmp/backups/secondary/${BACKUP_NAME}.sql.gz

# Offsite backup (simulated)
cp /tmp/backups/primary/${BACKUP_NAME}.sql.gz \
    /tmp/backups/offsite/${BACKUP_NAME}.sql.gz

# Keep only last 7 days
find /tmp/backups/primary -name "gaussdb_backup_*.sql.gz" -mtime +7 -delete
find /tmp/backups/secondary -name "gaussdb_backup_*.sql.gz" -mtime +7 -delete
find /tmp/backups/offsite -name "gaussdb_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_NAME}"
SCRIPT

chmod +x /tmp/backup_script.sh
echo "Backup script created:"
cat /tmp/backup_script.sh
```

[[bash -c "cat > /tmp/backup_script.sh <<'SCRIPT'
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=\"gaussdb_backup_\${BACKUP_DATE}\"
echo \"Starting backup: \${BACKUP_NAME}\"
gs_dump -h localhost -p 5432 -U postgres -Z 6 backup_test_db -f /tmp/backups/primary/\${BACKUP_NAME}.sql.gz
cp /tmp/backups/primary/\${BACKUP_NAME}.sql.gz /tmp/backups/secondary/\${BACKUP_NAME}.sql.gz
cp /tmp/backups/primary/\${BACKUP_NAME}.sql.gz /tmp/backups/offsite/\${BACKUP_NAME}.sql.gz
find /tmp/backups/primary -name \"gaussdb_backup_*.sql.gz\" -mtime +7 -delete
find /tmp/backups/secondary -name \"gaussdb_backup_*.sql.gz\" -mtime +7 -delete
find /tmp/backups/offsite -name \"gaussdb_backup_*.sql.gz\" -mtime +7 -delete
echo \"Backup completed: \${BACKUP_NAME}\"
SCRIPT
chmod +x /tmp/backup_script.sh && cat /tmp/backup_script.sh"]]{{RUN}}

**Run backup script**:
```bash
/tmp/backup_script.sh

# Verify backups
echo "Primary backups:"
ls -lh /tmp/backups/primary/

echo "Secondary backups:"
ls -lh /tmp/backups/secondary/

echo "Offsite backups:"
ls -lh /tmp/backups/offsite/
```

[[bash -c "/tmp/backup_script.sh && echo \"Primary backups:\" && ls -lh /tmp/backups/primary/ && echo \"Secondary backups:\" && ls -lh /tmp/backups/secondary/ && echo \"Offsite backups:\" && ls -lh /tmp/backups/offsite/"]]{{RUN}}

**What to observe**:
- Multiple backup locations improve resilience
- Automated scripts ensure consistency
- Retention policies manage storage costs

---

### Task 6: Backup Validation and Testing

Regularly test backup integrity and recovery procedures.

**Create backup verification script**:
```bash
cat > /tmp/verify_backup.sh <<'SCRIPT'
#!/bin/bash

BACKUP_FILE="/tmp/backups/primary/$(ls -t /tmp/backups/primary/gaussdb_backup_*.sql.gz | head -1)"

echo "Verifying backup: ${BACKUP_FILE}"

# Check file exists and is readable
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found"
    exit 1
fi

# Verify gzip integrity
gunzip -t "${BACKUP_FILE}"
if [ $? -eq 0 ]; then
    echo "✓ Gzip integrity check passed"
else
    echo "✗ Gzip integrity check failed"
    exit 1
fi

# Check backup file size
SIZE=$(stat -f%z "${BACKUP_FILE}")
echo "Backup file size: ${SIZE} bytes"

# Extract and validate SQL structure
gunzip -c "${BACKUP_FILE}" | head -50 | grep -q "CREATE TABLE"
if [ $? -eq 0 ]; then
    echo "✓ SQL structure validation passed"
else
    echo "✗ SQL structure validation failed"
    exit 1
fi

echo "Backup verification completed successfully"
SCRIPT

chmod +x /tmp/verify_backup.sh
```

[[bash -c "cat > /tmp/verify_backup.sh <<'SCRIPT'
#!/bin/bash
BACKUP_FILE=\"/tmp/backups/primary/\$(ls -t /tmp/backups/primary/gaussdb_backup_*.sql.gz | head -1)\"
echo \"Verifying backup: \${BACKUP_FILE}\"
if [ ! -f \"\${BACKUP_FILE}\" ]; then
    echo \"ERROR: Backup file not found\"
    exit 1
fi
gunzip -t \"\${BACKUP_FILE}\"
if [ \$? -eq 0 ]; then
    echo \"✓ Gzip integrity check passed\"
else
    echo \"✗ Gzip integrity check failed\"
    exit 1
fi
SIZE=\$(stat -f%z \"\${BACKUP_FILE}\")
echo \"Backup file size: \${SIZE} bytes\"
gunzip -c \"\${BACKUP_FILE}\" | head -50 | grep -q \"CREATE TABLE\"
if [ \$? -eq 0 ]; then
    echo \"✓ SQL structure validation passed\"
else
    echo \"✗ SQL structure validation failed\"
    exit 1
fi
echo \"Backup verification completed successfully\"
SCRIPT
chmod +x /tmp/verify_backup.sh"]]{{RUN}}

**Run verification**:
```bash
/tmp/verify_backup.sh
```

[[bash -c "/tmp/verify_backup.sh"]]{{RUN}}

**Restore test**:
```bash
# Test restore to temporary database
createdb -h localhost -p 5432 -U postgres backup_restore_test

gunzip -c /tmp/backups/primary/$(ls -t /tmp/backups/primary/gaussdb_backup_*.sql.gz | head -1) | \
    psql -h localhost -p 5432 -U postgres -d backup_restore_test

# Verify restore
psql -h localhost -p 5432 -U postgres -d backup_restore_test -c "\dt"
psql -h localhost -p 5432 -U postgres -d backup_restore_test -c "SELECT COUNT(*) FROM large_table;"

# Clean up test database
dropdb -h localhost -p 5432 -U postgres backup_restore_test
```

[[bash -c "createdb -h localhost -p 5432 -U postgres backup_restore_test && gunzip -c /tmp/backups/primary/$(ls -t /tmp/backups/primary/gaussdb_backup_*.sql.gz | head -1) | psql -h localhost -p 5432 -U postgres -d backup_restore_test && psql -h localhost -p 5432 -U postgres -d backup_restore_test -c \"\\dt\" && psql -h localhost -p 5432 -U postgres -d backup_restore_test -c \"SELECT COUNT(*) FROM large_table;\" && dropdb -h localhost -p 5432 -U postgres backup_restore_test"]]{{RUN}}

**What to observe**:
- Regular verification catches backup issues early
- Test restores ensure backups are usable
- Automated testing reduces human error

---

### Task 7: Backup Scheduling with Cron

Automate backup operations with scheduling.

**Create cron job configuration**:
```bash
# Daily backup at 2 AM
cat > /tmp/cron_backup.conf <<'CRON'
# GaussDB Backup Schedule
# Daily full backup at 2:00 AM
0 2 * * * /tmp/backup_script.sh >> /tmp/backups/backup.log 2>&1

# Weekly verification on Sunday at 3:00 AM
0 3 * * 0 /tmp/verify_backup.sh >> /tmp/backups/verify.log 2>&1

# Monthly cleanup on 1st at 4:00 AM
0 4 1 * * find /tmp/backups/primary -name "gaussdb_backup_*.sql.gz" -mtime +30 -delete >> /tmp/backups/cleanup.log 2>&1
CRON

echo "Cron configuration:"
cat /tmp/cron_backup.conf
```

[[bash -c "cat > /tmp/cron_backup.conf <<'CRON'
0 2 * * * /tmp/backup_script.sh >> /tmp/backups/backup.log 2>&1
0 3 * * 0 /tmp/verify_backup.sh >> /tmp/backups/verify.log 2>&1
0 4 1 * * find /tmp/backups/primary -name \"gaussdb_backup_*.sql.gz\" -mtime +30 -delete >> /tmp/backups/cleanup.log 2>&1
CRON
echo \"Cron configuration:\"
cat /tmp/cron_backup.conf"]]{{RUN}}

**Create backup monitoring script**:
```bash
cat > /tmp/monitor_backups.sh <<'SCRIPT'
#!/bin/bash

ALERT_EMAIL="admin@example.com"
BACKUP_DIR="/tmp/backups/primary"

# Check for recent backups
LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/gaussdb_backup_*.sql.gz 2>/dev/null | head -1)
if [ -z "${LATEST_BACKUP}" ]; then
    echo "ALERT: No backups found!" | mail -s "Backup Alert" ${ALERT_EMAIL}
    exit 1
fi

# Check backup age
BACKUP_AGE=$(( $(date +%s) - $(stat -f%m "${LATEST_BACKUP}") ))
if [ ${BACKUP_AGE} -gt 86400 ]; then
    echo "ALERT: Last backup is older than 24 hours" | mail -s "Backup Alert" ${ALERT_EMAIL}
    exit 1
fi

# Check backup size
BACKUP_SIZE=$(stat -f%z "${LATEST_BACKUP}")
if [ ${BACKUP_SIZE} -lt 1000 ]; then
    echo "ALERT: Backup size too small: ${BACKUP_SIZE} bytes" | mail -s "Backup Alert" ${ALERT_EMAIL}
    exit 1
fi

echo "Backup monitoring: OK"
exit 0
SCRIPT

chmod +x /tmp/monitor_backups.sh
cat /tmp/monitor_backups.sh
```

[[bash -c "cat > /tmp/monitor_backups.sh <<'SCRIPT'
#!/bin/bash
ALERT_EMAIL=\"admin@example.com\"
BACKUP_DIR=\"/tmp/backups/primary\"
LATEST_BACKUP=\$(ls -t \${BACKUP_DIR}/gaussdb_backup_*.sql.gz 2>/dev/null | head -1)
if [ -z \"\${LATEST_BACKUP}\" ]; then
    echo \"ALERT: No backups found!\"
    exit 1
fi
BACKUP_AGE=\$(( \$(date +%s) - \$(stat -f%m \"\${LATEST_BACKUP}\") ))
if [ \${BACKUP_AGE} -gt 86400 ]; then
    echo \"ALERT: Last backup is older than 24 hours\"
    exit 1
fi
BACKUP_SIZE=\$(stat -f%z \"\${LATEST_BACKUP}\")
if [ \${BACKUP_SIZE} -lt 1000 ]; then
    echo \"ALERT: Backup size too small: \${BACKUP_SIZE} bytes\"
    exit 1
fi
echo \"Backup monitoring: OK\"
exit 0
SCRIPT
chmod +x /tmp/monitor_backups.sh && cat /tmp/monitor_backups.sh"]]{{RUN}}

**Run monitoring**:
```bash
/tmp/monitor_backups.sh
echo "Exit code: $?"
```

[[bash -c "/tmp/monitor_backups.sh && echo \"Exit code: $?\""]]{{RUN}}

**What to observe**:
- Cron automates backup operations
- Monitoring ensures backups are running correctly
- Alerts catch issues quickly

---

### Task 8: Clean Up Test Environment

**Drop test database**:
```sql
\c postgres
DROP DATABASE backup_test_db;
```

[[gsql -d postgres -p 5432 -c "DROP DATABASE backup_test_db;"]]{{RUN}}

**Clean up backup files**:
```bash
# Clean up test backups
rm -rf /tmp/backups /tmp/base_backup /tmp/wal_archive
rm -f /tmp/backup_*.sql /tmp/backup_script.sh /tmp/verify_backup.sh /tmp/monitor_backups.sh
rm -f /tmp/recovery*.conf /tmp/cron_backup.conf
```

[[bash -c "rm -rf /tmp/backups /tmp/base_backup /tmp/wal_archive && rm -f /tmp/backup_*.sql /tmp/backup_script.sh /tmp/verify_backup.sh /tmp/monitor_backups.sh && rm -f /tmp/recovery*.conf /tmp/cron_backup.conf"]]{{RUN}}

**Verify cleanup**:
```bash
echo "Test files removed:"
ls -la /tmp/ | grep -E "(backup|recovery|wal)" || echo "No test files found"
```

[[bash -c "echo \"Test files removed:\" && ls -la /tmp/ | grep -E \"(backup|recovery|wal)\" || echo \"No test files found\""]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Implemented parallel backup strategy
- [ ] Task 2: Optimized backup with compression
- [ ] Task 3: Set up WAL archiving for incremental backups
- [ ] Task 4: Configured PITR scenarios
- [ ] Task 5: Implemented cross-region backup strategy
- [ ] Task 6: Created backup validation and testing
- [ ] Task 7: Set up automated backup scheduling
- [ ] Task 8: Cleaned up test environment

## Review Questions

1. **What is benefit of parallel backup?**
   - [ ] Smaller backup files
   - [ ] Faster backup completion time
   - [ ] Better compression
   - [ ] More reliable

2. **When should PITR be used?**
   - [ ] For regular daily backups
   - [ ] For recovery to specific point in time
   - [ ] For quick restores
   - [ ] For database upgrades

3. **What is purpose of backup verification?**
   - [ ] Reduce storage costs
   - [ ] Ensure backups are usable
   - [ ] Speed up backups
   - [ ] Compress backups

4. **What is advantage of cross-region backups?**
   - [ ] Faster restores
   - [ ] Disaster recovery resilience
   - [ ] Smaller files
   - [ ] Cheaper storage

## Summary

In this L3 lab, you practiced:
- **Parallel Backup**: Faster backups with multiple threads
- **Compression Optimization**: Balancing compression level and time
- **WAL Archiving**: Incremental backup with archived WAL
- **PITR**: Recovery to exact time, LSN, or transaction ID
- **Cross-Region Strategy**: Multi-location backup for DR
- **Backup Verification**: Ensuring backup integrity
- **Automated Scheduling**: Cron-based backup automation

These advanced backup and recovery techniques ensure data protection and enable reliable disaster recovery in GaussDB.

## Next Steps

Proceed to **L4 Lab** to practice expert-level operations including:
- Complex recovery scenarios
- Backup performance optimization at scale
- Multi-database backup strategies
- Cloud backup integration
- Advanced troubleshooting of backup failures
