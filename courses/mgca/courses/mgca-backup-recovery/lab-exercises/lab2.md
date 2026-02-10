# Backup and Recovery Module - L2 Lab: Incremental Backups

## Lab Overview

In this L2 (Intermediate Level) lab, you will practice advanced backup operations in GaussDB, including:
- Understanding incremental backup strategies
- Configuring WAL archiving for PITR
- Performing point-in-time recovery
- Automating backup schedules

**Time Required**: 45 minutes
**Prerequisites**: Completed L1 Backup Lab, test data in database

## Learning Objectives

By completing this lab, you will be able to:
- Configure WAL archiving for point-in-time recovery
- Perform incremental backups
- Restore database to specific point in time
- Set up automated backup schedules

## Lab Tasks

### Task 1: Configure WAL Archiving

Let's configure WAL archiving for point-in-time recovery.

**Check current WAL settings**:
```sql
SHOW wal_level;
SHOW archive_mode;
SHOW archive_command;
```

[[gsql -d postgres -p 5432 -c "SHOW wal_level; SHOW archive_mode; SHOW archive_command;"]]{{RUN}}

**Enable WAL archiving**:
```sql
-- Set wal_level to replica or logical
ALTER SYSTEM SET wal_level = 'replica';

-- Enable archive mode
ALTER SYSTEM SET archive_mode = 'on';

-- Set archive command
ALTER SYSTEM SET archive_command = 'cp %p /opt/gaussdb/wal_archive/%f';
```

[[gsql -d postgres -p 5432 -c "ALTER SYSTEM SET wal_level = 'replica'; ALTER SYSTEM SET archive_mode = 'on'; ALTER SYSTEM SET archive_command = 'cp %p /opt/gaussdb/wal_archive/%f';"]]{{RUN}}

**Create archive directory**:
```bash
mkdir -p /opt/gaussdb/wal_archive
chown omm:omm /opt/gaussdb/wal_archive
chmod 750 /opt/gaussdb/wal_archive
```

[[mkdir -p /opt/gaussdb/wal_archive]]{{RUN}}
[[chown omm:omm /opt/gaussdb/wal_archive]]{{RUN}}
[[chmod 750 /opt/gaussdb/wal_archive]]{{RUN}}

**Reload configuration**:
```bash
gs_ctl reload -D /opt/huawei/install/data/db1
```

[[gs_ctl reload -D /opt/huawei/install/data/db1]]{{RUN}}

**Verify archiving is active**:
```sql
SELECT 
    archived_count AS archived_files,
    last_archived_wal AS last_file,
    last_archived_time AS last_archive_time
FROM pg_stat_archiver;
```

[[gsql -d postgres -p 5432 -c "SELECT archived_count AS archived_files, last_archived_wal AS last_file, last_archived_time AS last_archive_time FROM pg_stat_archiver;"]]{{RUN}}

---

### Task 2: Create Full Backup Schedule

Let's set up regular full backups.

**Create backup schedule directory**:
```bash
mkdir -p /opt/gaussdb/backups/full
mkdir -p /opt/gaussdb/backups/incremental
chown -R omm:omm /opt/gaussdb/backups
```

[[mkdir -p /opt/gaussdb/backups/full]]{{RUN}}
[[mkdir -p /opt/gaussdb/backups/incremental]]{{RUN}}
[[chown -R omm:omm /opt/gaussdb/backups]]{{RUN}}

**Create full backup script**:
```bash
cat > /home/omm/scripts/full_backup.sh << 'EOF'
#!/bin/bash
# Full Backup Script
BACKUP_DIR="/opt/gaussdb/backups/full"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/full_${DATE}"

# Perform full backup
gs_basebackup -h localhost -p 5432 -U omm \
    -D ${BACKUP_PATH} \
    -Fp \
    -X stream \
    -P \
    -z \
    -T /opt/gaussdb/backups \
    -c fast

# Create manifest
echo "Backup completed: ${DATE}" > ${BACKUP_PATH}/backup_manifest.txt
echo "Size: $(du -sh ${BACKUP_PATH})" >> ${BACKUP_PATH}/backup_manifest.txt

# Clean up old backups (keep last 5)
find ${BACKUP_DIR} -type d -mtime +7 -exec rm -rf {} \;

echo "Full backup completed at ${DATE}"
EOF

chmod +x /home/omm/scripts/full_backup.sh
```

[[cat > /home/omm/scripts/full_backup.sh << 'EOF'
#!/bin/bash
# Full Backup Script
BACKUP_DIR="/opt/gaussdb/backups/full"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/full_${DATE}"

# Perform full backup
gs_basebackup -h localhost -p 5432 -U omm \
    -D ${BACKUP_PATH} \
    -Fp \
    -X stream \
    -P \
    -z \
    -T /opt/gaussdb/backups \
    -c fast

# Create manifest
echo "Backup completed: ${DATE}" > ${BACKUP_PATH}/backup_manifest.txt
echo "Size: $(du -sh ${BACKUP_PATH})" >> ${BACKUP_PATH}/backup_manifest.txt

# Clean up old backups (keep last 5)
find ${BACKUP_DIR} -type d -mtime +7 -exec rm -rf {} \;

echo "Full backup completed at ${DATE}"
EOF]]{{RUN}}

[[chmod +x /home/omm/scripts/full_backup.sh]]{{RUN}}

**Execute full backup**:
```bash
su - omm -c "/home/omm/scripts/full_backup.sh"
```

[[su - omm -c "/home/omm/scripts/full_backup.sh"]]{{RUN}}

**Verify backup**:
```bash
ls -lh /opt/gaussdb/backups/full/
```

[[ls -lh /opt/gaussdb/backups/full/]]{{RUN}}

---

### Task 3: Create Incremental Backup Strategy

Let's implement incremental backups using WAL files.

**Create incremental backup script**:
```bash
cat > /home/omm/scripts/incremental_backup.sh << 'EOF'
#!/bin/bash
# Incremental Backup Script
BACKUP_DIR="/opt/gaussdb/backups/incremental"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/inc_${DATE}"

# Create backup directory
mkdir -p ${BACKUP_PATH}

# Copy current WAL files (incremental backup)
cp -r /opt/gaussdb/wal_archive/* ${BACKUP_PATH}/

# Count archived WAL files
WAL_COUNT=$(ls -1 ${BACKUP_PATH}/*.wal 2>/dev/null | wc -l)

# Create manifest
cat > ${BACKUP_PATH}/backup_manifest.txt << MANIFEST
Incremental backup: ${DATE}
WAL files archived: ${WAL_COUNT}
Total size: $(du -sh ${BACKUP_PATH})
MANIFEST

# Clean up old incremental backups (keep last 24 hours)
find ${BACKUP_DIR} -type d -mmin +1440 -exec rm -rf {} \;

echo "Incremental backup completed: ${WAL_COUNT} WAL files"
EOF

chmod +x /home/omm/scripts/incremental_backup.sh
```

[[cat > /home/omm/scripts/incremental_backup.sh << 'EOF'
#!/bin/bash
# Incremental Backup Script
BACKUP_DIR="/opt/gaussdb/backups/incremental"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/inc_${DATE}"

# Create backup directory
mkdir -p ${BACKUP_PATH}

# Copy current WAL files (incremental backup)
cp -r /opt/gaussdb/wal_archive/* ${BACKUP_PATH}/

# Count archived WAL files
WAL_COUNT=$(ls -1 ${BACKUP_PATH}/*.wal 2>/dev/null | wc -l)

# Create manifest
cat > ${BACKUP_PATH}/backup_manifest.txt << MANIFEST
Incremental backup: ${DATE}
WAL files archived: ${WAL_COUNT}
Total size: $(du -sh ${BACKUP_PATH})
MANIFEST

# Clean up old incremental backups (keep last 24 hours)
find ${BACKUP_DIR} -type d -mmin +1440 -exec rm -rf {} \;

echo "Incremental backup completed: ${WAL_COUNT} WAL files"
EOF]]{{RUN}}

[[chmod +x /home/omm/scripts/incremental_backup.sh]]{{RUN}}

**Execute incremental backup**:
```bash
su - omm -c "/home/omm/scripts/incremental_backup.sh"
```

[[su - omm -c "/home/omm/scripts/incremental_backup.sh"]]{{RUN}}

**Verify incremental backup**:
```bash
ls -lh /opt/gaussdb/backups/incremental/
```

[[ls -lh /opt/gaussdb/backups/incremental/]]{{RUN}}

---

### Task 4: Schedule Automated Backups

Let's set up cron jobs for automated backups.

**Edit crontab for omm user**:
```bash
# Add full backup daily at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/omm/scripts/full_backup.sh >> /home/omm/scripts/backup.log 2>&1") | crontab -

# Add incremental backup every 6 hours
(crontab -l 2>/dev/null; echo "0 */6 * * * /home/omm/scripts/incremental_backup.sh >> /home/omm/scripts/backup.log 2>&1") | crontab -
```

[[(crontab -l 2>/dev/null; echo "0 2 * * * /home/omm/scripts/full_backup.sh >> /home/omm/scripts/backup.log 2>&1") | crontab -]]{{RUN}}
[[(crontab -l 2>/dev/null; echo "0 */6 * * * /home/omm/scripts/incremental_backup.sh >> /home/omm/scripts/backup.log 2>&1") | crontab -]]{{RUN}}

**Verify cron jobs**:
```bash
crontab -l
```

[[crontab -l]]{{RUN}}

**Check backup log**:
```bash
tail -20 /home/omm/scripts/backup.log
```

[[tail -20 /home/omm/scripts/backup.log]]{{RUN}}

---

### Task 5: Create Test Data for Recovery

Let's create test data to practice recovery.

**Create test database with data**:
```sql
CREATE DATABASE recovery_test;
```

[[gsql -d postgres -p 5432 -c "CREATE DATABASE recovery_test;"]]{{RUN}}

```sql
CREATE TABLE orders_recover (
    id INT PRIMARY KEY,
    customer_id INT,
    amount NUMERIC(10, 2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20)
);

INSERT INTO orders_recover (id, customer_id, amount, status)
SELECT 
    generate_series(1, 100),
    (random() * 100)::INT,
    (random() * 1000)::NUMERIC(10, 2),
    CASE WHEN random() > 0.5 THEN 'completed' ELSE 'pending' END
FROM generate_series(1, 100);
```

[[gsql -d recovery_test -p 5432 -c "CREATE TABLE orders_recover (id INT PRIMARY KEY, customer_id INT, amount NUMERIC(10, 2), order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, status VARCHAR(20)); INSERT INTO orders_recover (id, customer_id, amount, status) SELECT generate_series(1, 100), (random() * 100)::INT, (random() * 1000)::NUMERIC(10, 2), CASE WHEN random() > 0.5 THEN 'completed' ELSE 'pending' END FROM generate_series(1, 100);"]]{{RUN}}

**Note the current time**:
```sql
SELECT CURRENT_TIMESTAMP;
```

[[gsql -d recovery_test -p 5432 -c "SELECT CURRENT_TIMESTAMP;"]]{{RUN}}

**Record this timestamp for recovery later** (e.g., 2026-02-08 10:30:00)

---

### Task 6: Simulate Data Loss

Let's simulate data loss to practice recovery.

**Insert additional records**:
```sql
INSERT INTO orders_recover (id, customer_id, amount, status)
VALUES 
    (101, 1, 150.00, 'completed'),
    (102, 2, 200.50, 'completed'),
    (103, 3, 75.00, 'completed');
```

[[gsql -d recovery_test -p 5432 -c "INSERT INTO orders_recover (id, customer_id, amount, status) VALUES (101, 1, 150.00, 'completed'), (102, 2, 200.50, 'completed'), (103, 3, 75.00, 'completed');"]]{{RUN}}

**Verify current data**:
```sql
SELECT count(*) AS total_records FROM orders_recover;
```

[[gsql -d recovery_test -p 5432 -c "SELECT count(*) AS total_records FROM orders_recover;"]]{{RUN}}

**Expected**: 103 records (100 initial + 3 new)

**Simulate accidental deletion**:
```sql
DELETE FROM orders_recover WHERE id > 100;
```

[[gsql -d recovery_test -p 5432 -c "DELETE FROM orders_recover WHERE id > 100;"]]{{RUN}}

**Verify data loss**:
```sql
SELECT count(*) AS total_records FROM orders_recover;
```

[[gsql -d recovery_test -p 5432 -c "SELECT count(*) AS total_records FROM orders_recover;"]]{{RUN}}

**Expected**: 100 records (3 records deleted)

---

### Task 7: Perform Point-in-Time Recovery

Let's restore the database to the point before data loss.

**Stop the database**:
```bash
gs_ctl stop -D /opt/huawei/install/data/db1
```

[[gs_ctl stop -D /opt/huawei/install/data/db1]]{{RUN}}

**Create recovery configuration**:
```bash
cat > /opt/huawei/install/data/db1/recovery.conf << 'EOF'
# Point-in-Time Recovery Configuration
restore_command = 'cp /opt/gaussdb/wal_archive/%f %p'
recovery_target_time = '2026-02-08 10:25:00'  # Adjust to time before deletion
recovery_target_inclusive = true
EOF
```

[[cat > /opt/huawei/install/data/db1/recovery.conf << 'EOF'
# Point-in-Time Recovery Configuration
restore_command = 'cp /opt/gaussdb/wal_archive/%f %p'
recovery_target_time = '2026-02-08 10:25:00'  # Adjust to time before deletion
recovery_target_inclusive = true
EOF]]{{RUN}}

**Start the database in recovery mode**:
```bash
gs_ctl start -D /opt/huawei/install/data/db1
```

[[gs_ctl start -D /opt/huawei/install/data/db1]]{{RUN}}

**Wait for recovery to complete** (check logs):
```bash
tail -50 /opt/huawei/install/data/db1/log/*.log | grep -E "recovery|database system is ready"
```

[[tail -50 /opt/huawei/install/data/db1/log/*.log | grep -E "recovery|database system is ready"]]{{RUN}}

**What to look for**:
- "recovery target time reached at ..."
- "database system is ready to accept connections"

**Connect and verify recovery**:
```sql
SELECT count(*) AS total_records FROM orders_recover;
SELECT * FROM orders_recover WHERE id > 98 ORDER BY id;
```

[[gsql -d recovery_test -p 5432 -c "SELECT count(*) AS total_records FROM orders_recover;"]]{{RUN}}
[[gsql -d recovery_test -p 5432 -c "SELECT * FROM orders_recover WHERE id > 98 ORDER BY id;"]]{{RUN}}

**Expected**: Should see the 3 deleted records (PITR successful)

---

### Task 8: Monitor Backup Performance

Let's monitor backup performance and identify issues.

**Check backup execution time**:
```bash
grep "Full backup completed" /home/omm/scripts/backup.log | tail -5
grep "Incremental backup completed" /home/omm/scripts/backup.log | tail -5
```

[[grep "Full backup completed" /home/omm/scripts/backup.log | tail -5]]{{RUN}}
[[grep "Incremental backup completed" /home/omm/scripts/backup.log | tail -5]]{{RUN}}

**Check backup sizes**:
```bash
du -sh /opt/gaussdb/backups/full/*/
du -sh /opt/gaussdb/backups/incremental/*/
```

[[du -sh /opt/gaussdb/backups/full/*/]]{{RUN}}
[[du -sh /opt/gaussdb/backups/incremental/*/]]{{RUN}}

**Check WAL archiving status**:
```sql
SELECT 
    archived_count AS total_archived,
    failed_count AS failed_archives,
    last_archived_time,
    last_failed_time
FROM pg_stat_archiver;
```

[[gsql -d postgres -p 5432 -c "SELECT archived_count AS total_archived, failed_count AS failed_archives, last_archived_time, last_failed_time FROM pg_stat_archiver;"]]{{RUN}}

**What to observe**:
- **archived_count**: Number of WAL files archived
- **failed_count**: Should be 0
- **last_failed_time**: Null indicates no failures

---

### Task 9: Clean Up Test Data

Let's clean up the test database and artifacts.

**Drop test database**:
```sql
DROP DATABASE recovery_test;
```

[[gsql -d postgres -p 5432 -c "DROP DATABASE recovery_test;"]]{{RUN}}

**Remove test backup directories**:
```bash
rm -rf /opt/gaussdb/backups/full/
rm -rf /opt/gaussdb/backups/incremental/
```

[[rm -rf /opt/gaussdb/backups/full/]]{{RUN}}
[[rm -rf /opt/gaussdb/backups/incremental/]]{{RUN}}

**Remove cron jobs**:
```bash
crontab -r
```

[[crontab -r]]{{RUN}}

**Remove backup scripts**:
```bash
rm -f /home/omm/scripts/full_backup.sh
rm -f /home/omm/scripts/incremental_backup.sh
```

[[rm -f /home/omm/scripts/full_backup.sh]]{{RUN}}
[[rm -f /home/omm/scripts/incremental_backup.sh]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Configured WAL archiving for PITR
- [ ] Task 2: Created full backup schedule
- [ ] Task 3: Implemented incremental backup strategy
- [ ] Task 4: Scheduled automated backups with cron
- [ ] Task 5: Created test data for recovery
- [ ] Task 6: Simulated data loss scenario
- [ ] Task 7: Performed point-in-time recovery
- [ ] Task 8: Monitored backup performance
- [ ] Task 9: Cleaned up test data and artifacts

## Review Questions

1. **What is the purpose of archive_command?**
   - [ ] Compress WAL files
   - [ ] Copy WAL files to archive location
   - [ ] Delete old WAL files
   - [ ] Backup database

2. **What does PITR allow you to do?**
   - [ ] Restore entire database
   - [ ] Restore to specific point in time
   - [ ] Only recover deleted tables
   - [ ] Create new database

3. **What is the difference between full and incremental backups?**
   - [ ] No difference
   - [ ] Full backs up all data, incremental backs up changes
   - [ ] Incremental is faster to restore
   - [ ] Full uses more storage

4. **What does recovery_target_time specify in recovery.conf?**
   - [ ] Time to start recovery
   - [ ] Time to stop recovery
   - [ ] Time when backup was taken
   - [ ] Time interval between backups

## Summary

In this L2 lab, you practiced:
- **WAL Archiving**: Configuring archive_mode and archive_command
- **Full Backups**: Creating scheduled full backup scripts
- **Incremental Backups**: Implementing WAL-based incremental backups
- **Automation**: Setting up cron jobs for automated backups
- **PITR**: Performing point-in-time recovery using recovery.conf
- **Monitoring**: Tracking backup performance and archiving status
- **Cleanup**: Removing test data and backup artifacts

These intermediate backup and recovery operations enable you to implement robust data protection with automated backup schedules and point-in-time recovery.

## Best Practices

1. **Regular Testing**: Test recovery procedures regularly
2. **Monitoring**: Monitor backup performance and failures
3. **Retention**: Define backup retention policies
4. **Offsite Storage**: Store backups in separate location
5. **Documentation**: Document backup and recovery procedures

## Next Steps

Proceed to **L3 Lab** to practice advanced operations including:
- Cross-instance backup and restore
- Backup compression and encryption
- Advanced PITR scenarios
- Backup verification and integrity checking
- Disaster recovery planning
