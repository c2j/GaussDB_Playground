# Backup and Recovery Module - L1 Lab: Basic Backup Operations

## Lab Overview

In this L1 (Entry Level) lab, you will practice basic backup operations in GaussDB, including:
- Understanding backup concepts and strategies
- Performing physical backups with gs_basebackup
- Performing logical backups with gs_dump
- Verifying backup integrity

**Time Required**: 25 minutes
**Prerequisites**: GaussDB running with some test data

## Learning Objectives

By completing this lab, you will be able to:
- Understand different backup types and when to use them
- Perform a full physical backup of the database
- Perform a logical backup of specific tables
- Verify backup files exist and can be restored

## Lab Tasks

### Task 1: Understand Backup Concepts

Before performing backups, let's review key backup concepts.

**Check WAL configuration** (important for backup consistency):
```sql
SHOW wal_level;
```

[[gsql -d postgres -p 5432 -c "SHOW wal_level;"]]{{RUN}}

**Expected value**: `replica` or `logical` (required for consistent backups)

**Check archive mode** (for point-in-time recovery):
```sql
SHOW archive_mode;
```

[[gsql -d postgres -p 5432 -c "SHOW archive_mode;"]]{{RUN}}

**What to observe**:
- **on**: WAL archiving is enabled (required for PITR)
- **off**: WAL archiving is disabled (simple backups only)

**Check checkpoint settings**:
```sql
SELECT name, setting, unit
FROM pg_settings
WHERE name IN ('checkpoint_timeout', 'checkpoint_segments', 'checkpoint_completion_target');
```

[[gsql -d postgres -p 5432 -c "SELECT name, setting, unit FROM pg_settings WHERE name IN ('checkpoint_timeout', 'checkpoint_segments', 'checkpoint_completion_target');"]]{{RUN}}

**Key Points**:
- **Full Backup**: Complete database backup
- **Incremental Backup**: Only changes since last full backup
- **Physical Backup**: Raw data file copy (faster, backup consistency)
- **Logical Backup**: SQL dump (portable, selective restore)

---

### Task 2: Create Test Data for Backup

Let's create some test data to practice backups.

**Create a test database**:
```sql
CREATE DATABASE test_backup;
```

[[gsql -d postgres -p 5432 -c "CREATE DATABASE test_backup;"]]{{RUN}}

**Create test tables and data**:
```sql
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    price NUMERIC(10, 2)
);

CREATE TABLE orders (
    id INT PRIMARY KEY,
    product_id INT REFERENCES products(id),
    quantity INT,
    order_date DATE
);

INSERT INTO products VALUES 
    (1, 'Product A', 100.00),
    (2, 'Product B', 200.00),
    (3, 'Product C', 300.00);

INSERT INTO orders VALUES 
    (1, 1, 5, CURRENT_DATE),
    (2, 2, 3, CURRENT_DATE),
    (3, 3, 2, CURRENT_DATE);
```

[[gsql -d test_backup -p 5432 -c "CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(100), price NUMERIC(10, 2)); CREATE TABLE orders (id INT PRIMARY KEY, product_id INT REFERENCES products(id), quantity INT, order_date DATE); INSERT INTO products VALUES (1, 'Product A', 100.00), (2, 'Product B', 200.00), (3, 'Product C', 300.00); INSERT INTO orders VALUES (1, 1, 5, CURRENT_DATE), (2, 2, 3, CURRENT_DATE), (3, 3, 2, CURRENT_DATE);"]]{{RUN}}

**Verify data**:
```sql
SELECT * FROM products;
SELECT * FROM orders;
```

[[gsql -d test_backup -p 5432 -c "SELECT * FROM products;"]]{{RUN}}
[[gsql -d test_backup -p 5432 -c "SELECT * FROM orders;"]]{{RUN}}

---

### Task 3: Perform Logical Backup with gs_dump

Let's create a logical backup using gs_dump utility.

**Create backup directory**:
```bash
mkdir -p /tmp/gaussdb_backups
```

[[mkdir -p /tmp/gaussdb_backups]]{{RUN}}

**Backup entire database (plain text format)**:
```bash
gs_dump -h localhost -p 5432 -U omm -d test_backup -f /tmp/gaussdb_backups/test_backup_full.sql
```

[[gs_dump -h localhost -p 5432 -U omm -d test_backup -f /tmp/gaussdb_backups/test_backup_full.sql]]{{RUN}}

**Verify backup file created**:
```bash
ls -lh /tmp/gaussdb_backups/test_backup_full.sql
```

[[ls -lh /tmp/gaussdb_backups/test_backup_full.sql]]{{RUN}}

**View backup file contents (first 50 lines)**:
```bash
head -n 50 /tmp/gaussdb_backups/test_backup_full.sql
```

[[head -n 50 /tmp/gaussdb_backups/test_backup_full.sql]]{{RUN}}

**Backup specific table**:
```bash
gs_dump -h localhost -p 5432 -U omm -d test_backup -t products -f /tmp/gaussdb_backups/products_only.sql
```

[[gs_dump -h localhost -p 5432 -U omm -d test_backup -t products -f /tmp/gaussdb_backups/products_only.sql]]{{RUN}}

**Verify table backup**:
```bash
ls -lh /tmp/gaussdb_backups/products_only.sql
```

[[ls -lh /tmp/gaussdb_backups/products_only.sql]]{{RUN}}

---

### Task 4: Perform Backup with Custom Format

Let's create backups in custom format (more efficient for large databases).

**Backup in custom format**:
```bash
gs_dump -h localhost -p 5432 -U omm -d test_backup -F c -f /tmp/gaussdb_backups/test_backup_custom.dump
```

[[gs_dump -h localhost -p 5432 -U omm -d test_backup -F c -f /tmp/gaussdb_backups/test_backup_custom.dump]]{{RUN}}

**Verify custom format backup**:
```bash
ls -lh /tmp/gaussdb_backups/test_backup_custom.dump
```

[[ls -lh /tmp/gaussdb_backups/test_backup_custom.dump]]{{RUN}}

**Backup with compression**:
```bash
gs_dump -h localhost -p 5432 -U omm -d test_backup -F c -Z 6 -f /tmp/gaussdb_backups/test_backup_compressed.dump
```

[[gs_dump -h localhost -p 5432 -U omm -d test_backup -F c -Z 6 -f /tmp/gaussdb_backups/test_backup_compressed.dump]]{{RUN}}

**Compare file sizes**:
```bash
ls -lh /tmp/gaussdb_backups/*.dump /tmp/gaussdb_backups/*.sql
```

[[ls -lh /tmp/gaussdb_backups/*.dump /tmp/gaussdb_backups/*.sql]]{{RUN}}

**What to observe**:
- Plain text format (.sql) is readable but larger
- Custom format (.dump) is compressed and more efficient
- Compressed backup is smaller than uncompressed custom format

---

### Task 5: Restore from Logical Backup

Let's practice restoring from our logical backups.

**Create a new test database for restore**:
```sql
DROP DATABASE IF EXISTS test_backup_restore;
CREATE DATABASE test_backup_restore;
```

[[gsql -d postgres -p 5432 -c "DROP DATABASE IF EXISTS test_backup_restore;"]]{{RUN}}
[[gsql -d postgres -p 5432 -c "CREATE DATABASE test_backup_restore;"]]{{RUN}}

**Restore from plain text backup**:
```bash
gsql -h localhost -p 5432 -U omm -d test_backup_restore -f /tmp/gaussdb_backups/test_backup_full.sql
```

[[gsql -h localhost -p 5432 -U omm -d test_backup_restore -f /tmp/gaussdb_backups/test_backup_full.sql]]{{RUN}}

**Verify restore**:
```sql
\c test_backup_restore
SELECT * FROM products;
SELECT * FROM orders;
```

[[gsql -d test_backup_restore -p 5432 -c "SELECT * FROM products;"]]{{RUN}}
[[gsql -d test_backup_restore -p 5432 -c "SELECT * FROM orders;"]]{{RUN}}

**Restore single table from plain text backup**:
```sql
DROP TABLE IF EXISTS products CASCADE;
```

[[gsql -d test_backup_restore -p 5432 -c "DROP TABLE IF EXISTS products CASCADE;"]]{{RUN}}

```bash
gsql -h localhost -p 5432 -U omm -d test_backup_restore -f /tmp/gaussdb_backups/products_only.sql
```

[[gsql -h localhost -p 5432 -U omm -d test_backup_restore -f /tmp/gaussdb_backups/products_only.sql]]{{RUN}}

**Verify table restore**:
```sql
SELECT * FROM products;
```

[[gsql -d test_backup_restore -p 5432 -c "SELECT * FROM products;"]]{{RUN}}

---

### Task 6: Restore from Custom Format

Let's restore from custom format backup using gs_restore.

**Restore from custom format**:
```bash
gs_restore -h localhost -p 5432 -U omm -d test_backup_restore -c /tmp/gaussdb_backups/test_backup_custom.dump
```

[[gs_restore -h localhost -p 5432 -U omm -d test_backup_restore -c /tmp/gaussdb_backups/test_backup_custom.dump]]{{RUN}}

**Verify restore**:
```sql
SELECT * FROM products;
SELECT * FROM orders;
```

[[gsql -d test_backup_restore -p 5432 -c "SELECT * FROM products;"]]{{RUN}}
[[gsql -d test_backup_restore -p 5432 -c "SELECT * FROM orders;"]]{{RUN}}

**Restore specific table from custom format**:
```bash
gs_restore -h localhost -p 5432 -U omm -d test_backup_restore -t products /tmp/gaussdb_backups/test_backup_compressed.dump
```

[[gs_restore -h localhost -p 5432 -U omm -d test_backup_restore -t products /tmp/gaussdb_backups/test_backup_compressed.dump]]{{RUN}}

---

### Task 7: Physical Backup with gs_basebackup

Let's create a physical backup of the database cluster.

**Create directory for physical backup**:
```bash
mkdir -p /tmp/gaussdb_backups/physical
```

[[mkdir -p /tmp/gaussdb_backups/physical]]{{RUN}}

**Perform physical backup**:
```bash
gs_basebackup -h localhost -p 5432 -U omm -D /tmp/gaussdb_backups/physical/basebackup_$(date +%Y%m%d) -Fp -X stream -P
```

[[gs_basebackup -h localhost -p 5432 -U omm -D /tmp/gaussdb_backups/physical/basebackup_$(date +%Y%m%d) -Fp -X stream -P]]{{RUN}}

**What the options mean**:
- `-D`: Target directory for backup
- `-Fp`: Plain format (files copied as-is)
- `-X stream`: Include WAL files required for restore
- `-P`: Show progress information

**Verify physical backup**:
```bash
ls -lh /tmp/gaussdb_backups/physical/basebackup_*/
```

[[ls -lh /tmp/gaussdb_backups/physical/basebackup_*/]]{{RUN}}

**Check backup contents**:
```bash
find /tmp/gaussdb_backups/physical/basebackup_* -type f | head -20
```

[[find /tmp/gaussdb_backups/physical/basebackup_* -type f | head -20]]{{RUN}}

**What to observe**:
- Physical backup copies the entire data directory
- Includes database files, configuration files, and WAL
- Can be used to create a standby database or restore to a point in time

---

### Task 8: Verify Backup Integrity

Let's verify our backups are complete and valid.

**Check logical backup file size**:
```bash
du -sh /tmp/gaussdb_backups/*
```

[[du -sh /tmp/gaussdb_backups/*]]{{RUN}}

**List all backup files**:
```bash
find /tmp/gaussdb_backups -type f -exec ls -lh {} \;
```

[[find /tmp/gaussdb_backups -type f -exec ls -lh {} \;]]{{RUN}}

**Create backup manifest**:
```bash
cat > /tmp/gaussdb_backups/backup_manifest.txt << 'EOF'
Backup Manifest
Generated: $(date)
=====================================

Logical Backups:
- test_backup_full.sql: Full database backup (plain text)
- products_only.sql: Single table backup (plain text)
- test_backup_custom.dump: Full database backup (custom format)
- test_backup_compressed.dump: Compressed custom format backup

Physical Backups:
- basebackup_*: Physical cluster backup

Restore Test: SUCCESS - Data verified after restore
EOF
```

[[cat > /tmp/gaussdb_backups/backup_manifest.txt << 'EOF'
Backup Manifest
Generated: $(date)
=====================================

Logical Backups:
- test_backup_full.sql: Full database backup (plain text)
- products_only.sql: Single table backup (plain text)
- test_backup_custom.dump: Full database backup (custom format)
- test_backup_compressed.dump: Compressed custom format backup

Physical Backups:
- basebackup_*: Physical cluster backup

Restore Test: SUCCESS - Data verified after restore
EOF]]{{RUN}}

**View manifest**:
```bash
cat /tmp/gaussdb_backups/backup_manifest.txt
```

[[cat /tmp/gaussdb_backups/backup_manifest.txt]]{{RUN}}

---

## Lab Completion Checklist

Verify you have completed all tasks:

- [ ] Task 1: Reviewed backup concepts and WAL configuration
- [ ] Task 2: Created test database with sample data
- [ ] Task 3: Performed logical backups (full database and single table)
- [ ] Task 4: Created custom format backups with compression
- [ ] Task 5: Restored database from logical backup
- [ ] Task 6: Restored from custom format backup
- [ ] Task 7: Performed physical backup with gs_basebackup
- [ ] Task 8: Verified backup integrity and created manifest

## Review Questions

1. **What is the main difference between logical and physical backups?**
   - [ ] No difference
   - [ ] Logical backups are SQL dumps, physical backups copy raw files
   - [ ] Physical backups are SQL dumps, logical backups copy raw files
   - [ ] Logical backups are faster

2. **Which backup format is most space-efficient for large databases?**
   - [ ] Plain text (.sql)
   - [ ] Custom format (.dump)
   - [ ] Directory format
   - [ ] Tar format

3. **What does the -X stream option do in gs_basebackup?**
   - [ ] Compresses the backup
   - [ ] Includes WAL files required for restore
   - [ ] Shows progress
   - [ ] Excludes configuration files

4. **Which utility is used to restore from custom format backups?**
   - [ ] gsql
   - [ ] gs_restore
   - [ ] gs_basebackup
   - [ ] pg_restore

## Summary

In this L1 lab, you practiced:
- **Logical Backups**: Created backups with gs_dump in plain text and custom formats
- **Physical Backups**: Performed cluster-level backups with gs_basebackup
- **Backup Options**: Used compression and format options
- **Restore Operations**: Restored databases and tables using gsql and gs_restore
- **Backup Verification**: Verified backup file integrity and contents
- **Backup Strategies**: Understood different backup types and use cases

These basic backup and restore operations are essential for data protection and disaster recovery in GaussDB.

## Next Steps

Proceed to **L2 Lab** to practice intermediate backup operations including:
- Incremental backups
- Point-in-time recovery (PITR)
- Backup automation scripts
- Cross-instance backup and restore
- Backup performance optimization
