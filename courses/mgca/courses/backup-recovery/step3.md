# 逻辑备份（gs_dump/gs_restore）

## gs_dump 基础

### 作用
- 导出数据库或表为 SQL 脚本
- 灵活选择备份对象
- 支持跨平台恢复
- 可以选择性备份

### 基本语法

```bash
gs_dump [OPTIONS] [dbname]
```

### 常用选项

- `-d`: 指定数据库名
- `-f`: 指定输出文件
- `-n`: 不导出数据（只导出结构）
- `-a`: 只导出数据（不导出结构）
- `-s`: 只导出模式
- `-t`: 指定表名
- `-T`: 排除表名
- `-C`: 包含 DROP/CREATE 命令
- `-F`: 输出格式（p/plain, c/custom, t/tar）

## 备份单个数据库

### 基本备份

```bash
gs_dump -d app_db -f /backup/app_db_backup_$(date +%Y%m%d).sql
```

### 只备份结构

```bash
gs_dump -d app_db -n -f /backup/app_db_schema.sql
```

### 只备份数据

```bash
gs_dump -d app_db -a -f /backup/app_db_data.sql
```

### 压缩备份

```bash
gs_dump -d app_db -f /backup/app_db_backup.sql.gz -Z
```

## 备份所有数据库

### 备份所有数据库

```bash
gs_dumpall -f /backup/all_databases_$(date +%Y%m%d).sql
```

### 只备份全局对象

```bash
gs_dumpall -g -f /backup/global_objects.sql
```

## 备份指定表

### 备份单个表

```bash
gs_dump -d app_db -t orders -f /backup/orders_backup.sql
```

### 备份多个表

```bash
gs_dump -d app_db -t orders -t products -f /backup/orders_products.sql
```

### 排除指定表

```bash
gs_dump -d app_db -T temp_table -T log_table -f /backup/main_tables.sql
```

## 不同格式备份

### Plain SQL 格式

```bash
gs_dump -d app_db -F p -f /backup/app_backup.sql
```

### Custom 格式

```bash
gs_dump -d app_db -F c -f /backup/app_backup.dump
```

### Tar 格式

```bash
gs_dump -d app_db -F t -f /backup/app_backup.tar
```

## gs_restore 恢复

### 基本语法

```bash
gs_restore [OPTIONS] filename
```

### 常用选项

- `-d`: 指定目标数据库
- `-n`: 只执行 SQL，不执行
- `-C`: 先创建数据库
- `-a`: 只恢复数据
- `-s`: 只恢复结构
- `-l`: 列出备份内容
- `-t`: 恢复指定表
- `-j`: 并发数

## 恢复数据库

### 恢复整个数据库

```bash
gs_restore -d app_db /backup/app_backup.dump
```

### 创建数据库并恢复

```bash
gs_restore -C -d postgres /backup/app_backup.dump
```

### 只恢复结构

```bash
gs_restore -s -d app_db_new /backup/app_backup.dump
```

### 只恢复数据

```bash
gs_restore -a -d app_db_new /backup/app_backup.dump
```

## 恢复指定表

### 恢复单个表

```bash
gs_restore -t orders -d app_db_new /backup/app_backup.dump
```

### 恢复多个表

```bash
gs_restore -t orders -t products -d app_db_new /backup/app_backup.dump
```

## 并行恢复

### 使用并行加速恢复

```bash
gs_restore -j 4 -d app_db_new /backup/app_backup.dump
```

## 查看备份内容

### 列出备份内容

```bash
gs_restore -l /backup/app_backup.dump
```

### 只列出结构

```bash
gs_restore -l -s /backup/app_backup.dump
```

## Tips

**逻辑备份最佳实践**:
- 定期备份重要表
- 使用压缩节省空间
- 在业务低峰期执行备份
- 验证备份文件完整性
- 保留多个版本的备份
- 测试恢复流程

**备份选择**:
- 全量备份：定期（每周/每月）
- 增量备份：频繁（每日）
- 重要表单独备份
- 归档历史数据

**恢复优化**:
- 使用并行恢复加速
- 分批恢复大表
- 先恢复结构，再恢复数据
- 关闭触发器和约束

**企业规范**:
- [ ] 制定逻辑备份计划
- [ ] 定期备份关键表
- [ ] 使用压缩节省空间
- [ ] 在业务低峰期执行备份
- [ ] 定期验证备份完整性
- [ ] 测试恢复流程
- [ ] 保留多个备份版本

## 任务

创建备份目录:

`[[mkdir -p /backup/logical]]{{PRINT}}`

备份单个数据库:

```
[[gs_dump -d app_db -f /backup/logical/app_db_$(date +%Y%m%d).sql]]{{RUN}}
```

查看备份文件:

`[[ls -lh /backup/logical/]]{{RUN}}`

只备份结构:

```
[[gs_dump -d app_db -n -f /backup/logical/app_db_schema.sql]]{{RUN}}
```

压缩备份:

```
[[gs_dump -d app_db -f /backup/logical/app_db_$(date +%Y%m%d).sql.gz -Z]]{{RUN}}
```

查看备份内容:

`[[head -50 /backup/logical/app_db_$(date +%Y%m%d).sql]]{{PRINT}}`

查看备份大小:

`[[du -sh /backup/logical/]]{{RUN}}`

列出备份内容:

```
[[gs_restore -l /backup/logical/app_db_backup.dump]]{{PRINT}}
```

创建新数据库用于恢复:

`[[CREATE DATABASE app_db_test;]]{{RUN}}`

恢复到新数据库:

```
[[gs_restore -d app_db_test /backup/logical/app_db_backup.dump]]{{RUN}}
```

验证恢复:

`[[SELECT * FROM app_db_test.users LIMIT 10;]]{{RUN}}`

## 错误演示

数据库不存在:

```bash
# 会报错 "database does not exist"
gs_dump -d non_existent_db -f /backup/backup.sql
```

说明: 需要先创建数据库或使用 gs_dumpall。

恢复时表已存在:

```bash
# 会报错 "relation already exists"
gs_restore -d app_db /backup/app_backup.dump
```

说明: 需要使用 `-C` 创建新数据库或使用 `--if-exists` 选项。
