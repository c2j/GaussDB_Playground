# 物理备份（gs_basebackup）

## gs_basebackup 基础

### 作用
- 创建数据库的完整物理备份
- 文件系统级别复制数据文件
- 支持压缩减少存储空间

### 基本语法

```bash
gs_basebackup [OPTIONS] -D target_directory
```

### 常用选项

- `-D`: 指定备份目录
- `-F`: 备份格式（plain/custom/tar）
- `-X`: 备份方法（fetch/stream）
- `-P`: 显示进度
- `-Z`: 压缩级别（0-9）
- `-l`: 标签备份
- `-T`: 指定表空间备份

## 全量备份

### 基本全量备份

```bash
gs_basebackup -D /backup/gaussdb_full_20240101
```

### 带标签的全量备份

```bash
gs_basebackup -D /backup/gaussdb_full_20240101 -l "weekly_full"
```

### 压缩全量备份

```bash
gs_basebackup -D /backup/gaussdb_full_20240101 -Z 5
```

## 增量备份

### 基于上一次备份的增量

```bash
# 全量备份
gs_basebackup -D /backup/gaussdb_full_20240101 -l "full"

# 增量备份（基于全量）
gs_basebackup -D /backup/gaussdb_inc_20240102 -D /backup/gaussdb_full_20240101
```

## 表空间备份

### 备份指定表空间

```bash
gs_basebackup -D /backup/tbspace_backup -T ts_data
```

### 备份多个表空间

```bash
gs_basebackup -D /backup/all_tbspaces -T ts_data -T ts_idx -T ts_log
```

## 备份验证

### 检查备份完整性

```bash
# 检查备份目录
ls -lh /backup/gaussdb_full_20240101

# 检查备份标签
cat /backup/gaussdb_full_20240101/backup_label
```

### 恢复测试

恢复备份到新实例验证：
1. 停止原实例
2. 删除或重命名数据目录
3. 将备份文件复制到数据目录
4. 修改配置文件
5. 启动新实例

## 备份优化

### 排除不必要的数据

```bash
# 备份时排除临时文件
gs_basebackup -D /backup/gaussdb_optimized \
    --exclude-temp-files \
    --no-sync
```

### 并行备份

对于大型数据库，可以使用并行备份：
```bash
# GaussDB 可能在未来版本支持
# 或者使用文件系统级别的快照
```

## Tips

**物理备份最佳实践**:
- 定期进行全量备份
- 在业务低峰期执行备份
- 验证备份完整性
- 保留多个版本的备份
- 将备份存储到异地
- 使用压缩节省空间

**备份策略**:
- 每周全量备份
- 每日增量备份
- 根据数据量选择备份频率
- 结合 WAL 归档实现 PITR

**企业规范**:
- [ ] 制定明确的备份计划
- [ ] 在业务低峰期执行备份
- [ ] 定期验证备份完整性
- [ ] 保留多个备份版本
- [ ] 将备份存储到异地
- [ ] 使用加密保护备份数据
- [ ] 监控备份状态
- [ ] 设置备份失败告警

## 任务

创建备份目录:

`[[mkdir -p /backup/gaussdb]]{{PRINT}}`

执行全量备份:

```
[[gs_basebackup -D /backup/gaussdb_full -l "full_backup_$(date +%Y%m%d)"]]{{PRINT}}
```

查看备份文件:

`[[ls -lh /backup/gaussdb_full]]{{RUN}}`

查看备份标签:

`[[cat /backup/gaussdb_full/backup_label]]{{RUN}}`

检查备份大小:

`[[du -sh /backup/gaussdb_full]]{{RUN}}`

备份配置文件:

`[[cp /opt/gaussdb/data/postgresql.conf /backup/gaussdb_full/]]{{PRINT}}`

备份 pg_hba.conf:

`[[cp /opt/gaussdb/data/pg_hba.conf /backup/gaussdb_full/]]{{PRINT}}`

压缩备份:

```
[[tar -czf /backup/gaussdb_full_$(date +%Y%m%d).tar.gz -C /backup gaussdb_full]]{{RUN}}
```

验证压缩文件:

`[[ls -lh /backup/gaussdb_full_*.tar.gz]]{{RUN}}`

## 错误演示

备份目录已存在:

```bash
# 会报错 "directory already exists"
gs_basebackup -D /backup/gaussdb_full
```

说明: 需要使用新的备份目录或删除旧备份。

权限不足:

```bash
# 会报错 "permission denied"
gs_basebackup -D /backup/gaussdb_full
```

说明: 确保数据库用户有权限访问和创建备份目录。
