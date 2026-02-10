# 时点恢复（PITR）

## PITR 概述

### 定义
Point-In-Time Recovery（时点恢复）允许将数据库恢复到过去某个特定的时间点或事务ID。

### 应用场景
- 误删除数据恢复
- 误更新数据回滚
- 数据损坏恢复
- 审计和合规要求

### 前提条件
- 启用 WAL 归档（archive_mode = on）
- 完整的物理备份
- 可用的 WAL 日志文件

## WAL 归档配置

### 启用归档

```sql
-- 查看当前归档状态
SHOW archive_mode;
```

### 配置归档

在 `postgresql.conf` 中配置：

```
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
archive_timeout = 300
```

### 重启使配置生效

```bash
gs_ctl restart
```

### 验证归档

```bash
# 检查归档目录
ls -lh /archive/
```

## 恢复流程

### 1. 停止数据库

```bash
gs_ctl stop
```

### 2. 备份当前数据目录

```bash
mv /opt/gaussdb/data /opt/gaussdb/data_backup
```

### 3. 恢复物理备份

```bash
# 将备份恢复到数据目录
cp -r /backup/gaussdb_full/* /opt/gaussdb/data/
```

### 4. 创建恢复命令文件

在数据目录创建 `recovery.conf` 或 `recovery.signal`:

```
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2024-01-01 10:30:00'
```

恢复目标选项:
- `recovery_target_time`: 恢复到指定时间点
- `recovery_target_xid`: 恢复到指定事务ID
- `recovery_target_name`: 恢复到指定命名还原点
- `recovery_target_lsn`: 恢复到指定LSN

### 5. 启动数据库进入恢复模式

```bash
gs_ctl start
```

### 6. 监控恢复过程

```bash
# 查看数据库日志
tail -f /opt/gaussdb/log/postgresql-*.log
```

### 7. 恢复完成后

数据库会自动停止或变为只读模式。删除恢复配置文件并重启：

```bash
rm /opt/gaussdb/data/recovery.conf
gs_ctl start
```

## 恢复到指定时间

### 恢复到具体时间

```bash
# 停止数据库
gs_ctl stop

# 创建 recovery.conf
cat > /opt/gaussdb/data/recovery.conf << EOF
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2024-01-01 10:30:00'
EOF

# 启动数据库
gs_ctl start
```

### 恢复到相对时间

```bash
# 恢复到1小时前
recovery_target_time = "'$(date -d '1 hour ago' '+%Y-%m-%d %H:%M:%S')'"
```

## 恢复到指定事务

### 查看事务ID

```sql
-- 查看最近的事务
SELECT
    xmin,
    xmax,
    query_start,
    state_change
FROM pg_stat_activity
ORDER BY query_start DESC
LIMIT 10;
```

### 恢复到指定XID

```bash
cat > /opt/gaussdb/data/recovery.conf << EOF
restore_command = 'cp /archive/%f %p'
recovery_target_xid = '1234567890'
EOF
```

## 恢复到命名还原点

### 创建命名还原点

```sql
-- 在恢复前创建命名还原点
SELECT pg_create_restore_point('before_delete');
```

### 恢复到命名还原点

```bash
cat > /opt/gaussdb/data/recovery.conf << EOF
restore_command = 'cp /archive/%f %p'
recovery_target_name = 'before_delete'
EOF
```

## 恢复选项

### 即时恢复（immediate）

```bash
cat > /opt/gaussdb/data/recovery.conf << EOF
restore_command = 'cp /archive/%f %p'
recovery_target = immediate
EOF
```

### 最新恢复（latest）

```bash
cat > /opt/gaussdb/data/recovery.conf << EOF
restore_command = 'cp /archive/%f %p'
recovery_target = latest
EOF
```

### 严格恢复（default）

```bash
cat > /opt/gaussdb/data/recovery.conf << EOF
restore_command = 'cp /archive/%f %p'
recovery_target = default
EOF
```

## Tips

**PITR 最佳实践**:
- 定期进行全量备份
- 确保 WAL 归档正常工作
- 在测试环境练习恢复流程
- 记录关键时间点（如重大操作前）
- 定期测试恢复流程
- 制定明确的恢复SOP

**恢复策略**:
- 误删除/更新：恢复到误操作前的时间点
- 数据损坏：恢复到最后一次完整备份
- 审计要求：恢复到指定审计时间点

**注意事项**:
- 恢复过程会重放所有WAL，可能需要较长时间
- 恢复后的数据可能不包含恢复后的修改
- 生产环境恢复需要谨慎操作
- 恢复前务必备份当前数据

**企业规范**:
- [ ] 启用 WAL 归档
- [ ] 定期进行全量备份
- [ ] 定期测试 PITR 流程
- [ ] 记录关键操作时间点
- [ ] 制定恢复操作SOP
- [ ] 在测试环境验证恢复
- [ ] 准备应急恢复流程
- [ ] 设置恢复时间目标（RTO）

## 任务

检查 WAL 归档状态:

```sql
SHOW archive_mode;
SHOW archive_command;
```

查看归档目录:

`[[ls -lh /archive/]]{{RUN}}`

模拟误操作:

```sql
-- 记录当前时间
SELECT NOW();

-- 删除重要数据
DELETE FROM users WHERE user_id = 1;

-- 查看删除结果
SELECT * FROM users WHERE user_id = 1;
```

停止数据库:

```
[[gs_ctl stop]]{{RUN}}
```

创建恢复配置:

```
[[
cat > /opt/gaussdb/data/recovery.conf << 'EOF'
restore_command = 'cp /archive/%f %p'
recovery_target_time = '$(date -d '5 minutes ago' '+%Y-%m-%d %H:%M:%S')'
EOF
]]{{RUN}}
```

启动数据库恢复:

```
[[gs_ctl start]]{{RUN}}
```

验证恢复结果:

```sql
-- 检查被删除的数据是否恢复
SELECT * FROM users WHERE user_id = 1;
```

删除恢复配置:

```
[[
rm /opt/gaussdb/data/recovery.conf
]]{{RUN}}
```

重启数据库:

```
[[gs_ctl restart]]{{RUN}}
```

## 错误演示

WAL 归档未启用:

```bash
# 如果 archive_mode = off，无法进行 PITR
SHOW archive_mode;
```

说明: 必须启用 archive_mode = on 才能进行时点恢复。

恢复目标时间在备份之前:

```bash
# recovery_target_time 早于备份时间，恢复会失败
recovery_target_time = '2020-01-01 00:00:00'
```

说明: 恢复目标时间必须在备份时间之后。
