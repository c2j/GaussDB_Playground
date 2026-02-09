# 备份自动化和调度

## 自动备份脚本

### 全量备份脚本

```bash
#!/bin/bash
# 全量备份脚本
BACKUP_DIR="/backup/gaussdb_full"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/backup/logs/backup_${DATE}.log"

# 创建备份目录
mkdir -p "$BACKUP_DIR"
mkdir -p /backup/logs

# 执行备份
echo "[$(date)] Starting full backup..." >> "$LOG_FILE"
gs_basebackup -D "$BACKUP_DIR/gaussdb_$DATE" -l "full_backup_$DATE" 2>> "$LOG_FILE"

# 验证备份
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed successfully" >> "$LOG_FILE"
    # 压缩备份
    tar -czf "$BACKUP_DIR/gaussdb_$DATE.tar.gz" -C "$BACKUP_DIR" gaussdb_$DATE
    echo "[$(date)] Backup compressed" >> "$LOG_FILE"
else
    echo "[$(date)] Backup FAILED!" >> "$LOG_FILE"
    # 发送告警
    # echo "Backup failed!" | mail -s "Backup Alert" admin@example.com
fi

# 清理旧备份（保留最近7天）
find "$BACKUP_DIR" -name "gadbsdb_*" -type d -mtime +7 -exec rm -rf {} \;
```

### 逻辑备份脚本

```bash
#!/bin/bash
# 逻辑备份脚本
BACKUP_DIR="/backup/logical"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/backup/logs/logical_backup_${DATE}.log"

# 创建备份目录
mkdir -p "$BACKUP_DIR"
mkdir -p /backup/logs

# 备份关键数据库
DBS="app_db reporting_db audit_db"

for db in $DBS; do
    echo "[$(date)] Backing up $db..." >> "$LOG_FILE"
    gs_dump -d "$db" -f "$BACKUP_DIR/${db}_$DATE.sql.gz" -Z 2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] $db backup completed" >> "$LOG_FILE"
    else
        echo "[$(date)] $db backup FAILED!" >> "$LOG_FILE"
        # 发送告警
    fi
done

# 清理旧备份（保留最近30天）
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

## Cron 调度

### Crontab 基本语法

```bash
# 分 时 日 月 周 命令
# * * * * * command

# 示例：
# 每天凌晨2点执行
0 2 * * * /backup/scripts/nightly_backup.sh

# 每周日凌晨3点执行
0 3 * * 0 /backup/scripts/weekly_backup.sh

# 每月1号凌晨4点执行
0 4 1 * * /backup/scripts/monthly_backup.sh
```

### 配置备份调度

```bash
# 编辑 crontab
crontab -e

# 添加以下行：
# 每天凌晨2点执行全量备份
0 2 * * * /backup/scripts/full_backup.sh >> /backup/logs/cron.log 2>&1

# 每小时执行WAL归档检查
0 * * * * /backup/scripts/check_archive.sh >> /backup/logs/cron.log 2>&1

# 每天凌晨3点执行逻辑备份
0 3 * * * /backup/scripts/logical_backup.sh >> /backup/logs/cron.log 2>&1

# 每周日凌晨4点执行备份清理
0 4 * * 0 /backup/scripts/cleanup_backups.sh >> /backup/logs/cron.log 2>&1
```

## 监控和告警

### 备份状态检查

```bash
#!/bin/bash
# 检查备份状态
BACKUP_DIR="/backup"
MAX_AGE_HOURS=24
ALERT_EMAIL="admin@example.com"

# 检查最新备份
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    echo "No backups found!"
    echo "No backups found!" | mail -s "Backup Alert" "$ALERT_EMAIL"
else
    BACKUP_AGE=$(( ($(date +%s) - LATEST_BACKUP) / 3600 ))
    
    if [ $BACKUP_AGE -gt $MAX_AGE_HOURS ]; then
        echo "Latest backup is $BACKUP_AGE hours old (max: $MAX_AGE_HOURS)"
        echo "Backup is $BACKUP_AGE hours old!" | mail -s "Backup Alert" "$ALERT_EMAIL"
    fi
fi

# 检查WAL归档
ARCHIVE_DIR="/archive"
LATEST_WAL=$(find "$ARCHIVE_DIR" -name "*.sql" -type f -printf '%T@ %p\n' | sort -rn | head -1)

if [ -n "$LATEST_WAL" ]; then
    echo "No archived WAL found!"
    echo "No archived WAL found!" | mail -s "Backup Alert" "$ALERT_EMAIL"
fi
```

### 磁盘空间监控

```bash
#!/bin/bash
# 检查磁盘空间
BACKUP_PARTITION="/backup"
MAX_USAGE=90
ALERT_EMAIL="admin@example.com"

USAGE=$(df "$BACKUP_PARTITION" | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $USAGE -gt $MAX_USAGE ]; then
    echo "Disk usage is ${USAGE}% (max: ${MAX_USAGE}%)"
    echo "Disk usage alert!" | mail -s "Disk Alert" "$ALERT_EMAIL"
fi
```

## 验证和测试

### 自动备份验证

```bash
#!/bin/bash
# 验证备份完整性
BACKUP_FILE="$1"

# 检查文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# 检查文件大小
FILE_SIZE=$(stat -f%z "$BACKUP_FILE")
MIN_SIZE=1000000  # 1MB

if [ $FILE_SIZE -lt $MIN_SIZE ]; then
    echo "Backup file too small: $FILE_SIZE bytes"
    exit 1
fi

# 尝试恢复到测试环境（可选）
# gs_restore -l "$BACKUP_FILE"

echo "Backup validation passed: $BACKUP_FILE"
```

### 恢复测试

```bash
#!/bin/bash
# 定期测试恢复流程
BACKUP_DIR="/backup/gaussdb_full"
TEST_DIR="/backup/test_restore"
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1)

# 创建测试目录
mkdir -p "$TEST_DIR"

# 解压备份
tar -xzf "$LATEST_BACKUP" -C "$TEST_DIR"

# 验证备份内容
if [ -d "$TEST_DIR/gaussdb_*/base" ]; then
    echo "Backup structure is valid"
else
    echo "Backup structure is invalid!"
    exit 1
fi
```

## Tips

**自动化最佳实践**:
- 使用日志记录所有备份操作
- 设置磁盘空间监控和告警
- 定期测试恢复流程
- 保留多个版本的备份
- 实施备份失败告警
- 监控备份执行时间和性能
- 定期验证备份完整性

**调度策略**:
- 全量备份：每天凌晨（业务低峰）
- 增量备份：每小时
- WAL 归档：持续进行
- 逻辑备份：关键表每天备份
- 清理任务：定期清理旧备份

**告警设置**:
- 备份失败立即告警
- 备份超时告警
- 磁盘空间不足告警
- WAL 归档失败告警
- 恢复测试失败告警

**企业规范**:
- [ ] 制定详细的备份计划
- [ ] 实施自动化备份
- [ ] 配置备份失败告警
- [ ] 定期验证备份完整性
- [ ] 定期测试恢复流程
- [ ] 实施异地备份存储
- [ ] 使用加密保护备份数据
- [ ] 监控备份性能和状态
- [ ] 制定应急恢复SOP

## 任务

创建备份脚本目录:

```
[[
mkdir -p /backup/scripts
]]{{RUN}}
```

创建全量备份脚本:

```bash
cat > /backup/scripts/full_backup.sh << 'EOFBASH'
#!/bin/bash
BACKUP_DIR="/backup/gaussdb_full"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/backup/logs/backup_${DATE}.log"

mkdir -p "$BACKUP_DIR"
mkdir -p /backup/logs

echo "[$(date)] Starting full backup..." >> "$LOG_FILE"
gs_basebackup -D "$BACKUP_DIR/gaussdb_$DATE" 2>> "$LOG_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed" >> "$LOG_FILE"
    tar -czf "$BACKUP_DIR/gaussdb_$DATE.tar.gz" -C "$BACKUP_DIR" gaussdb_$DATE
else
    echo "[$(date)] Backup FAILED!" >> "$LOG_FILE"
    exit 1
fi
EOFBASH

chmod +x /backup/scripts/full_backup.sh
]]{{RUN}}
```

测试备份脚本:

`[[/backup/scripts/full_backup.sh]]{{RUN}}`

验证备份:

`[[ls -lh /backup/gaussdb_full/]]{{RUN}}`

配置 Cron 调度:

```
[[
crontab -e << 'EOF'
# 每天凌晨2点执行全量备份
0 2 * * * /backup/scripts/full_backup.sh >> /backup/logs/cron.log 2>&1
EOF
]]{{RUN}}
```

查看 Cron 任务:

```
[[
crontab -l
]]{{RUN}}
```

创建日志目录:

`[[mkdir -p /backup/logs]]{{RUN}}`

## 错误演示

磁盘空间不足:

```bash
# 备份会失败并记录错误
gs_basebackup -D /backup/full
# Error: could not write to file: No space left on device
```

说明: 需要监控磁盘空间并清理旧备份。

备份目录权限不足:

```bash
# 备份脚本会失败
/backup/scripts/full_backup.sh
# Error: permission denied
```

说明: 需要确保备份脚本有写权限。

Cron 未运行:

```bash
# 备份没有按计划执行
crontab -l
# 看不到计划任务
```

说明: 需要正确配置 crontab 并确保 cron 服务运行。
