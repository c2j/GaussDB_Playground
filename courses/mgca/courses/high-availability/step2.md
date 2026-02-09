# 主备配置

## 主备部署准备

### 网络配置
- 主备节点网络互通
- 配置 /etc/hosts
- 开放必要端口（5432, 5434等）

### 防火墙配置
- 允许主备节点通信
- 开放应用访问端口
- 配置安全组规则

## 主节点配置

### postgresql.conf 配置

```
# 监听地址
listen_addresses = '*'

# 端口
port = 5432

# WAL 级别
wal_level = replica

# WAL 方法
wal_sync_method = on

# 最大 WAL 发送数
max_wal_senders = 10

# WAL 保留大小
wal_keep_segments = 100
```

### pg_hba.conf 配置

```
# 允许备节点连接
host    replication     replicator        192.168.1.20/32      md5
```

### 创建复制用户

```sql
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'Repl@2024';
```

## 备节点配置

### 配置主节点信息

```
# 主节点连接信息
primary_conninfo = 'host=192.168.1.10 port=5432 user=replicator password=Repl@2024'
```

### standby.signal

```bash
# 创建 standby.signal 标记为备节点
touch /opt/gaussdb/data/standby.signal
```

## 初始化备节点

### 使用 gs_basebackup

```bash
gs_basebackup -h 192.168.1.10 -p 5432 -U replicator -D /opt/gaussdb/data -P
```

参数说明:
- `-h`: 主节点主机
- `-p`: 主节点端口
- `-U`: 复制用户
- `-D`: 备节点数据目录
- `-P`: 进度显示

## 启动备节点

### 启动数据库

```bash
gs_ctl start
```

### 验证复制

```sql
-- 在主节点查询复制状态
SELECT * FROM pg_stat_replication;
```

## 同步复制配置

### 设置同步模式

```sql
-- 在主节点设置
SET synchronous_commit = on;
SET synchronous_standby_names = 'standby1';
```

### 半同步复制

```sql
-- 至少一个备节点同步
SET synchronous_commit = remote_apply;
SET synchronous_standby_names = 'ANY 1(standby1,standby2)';
```

## 级联配置

### 多个备节点

```sql
-- 配置两个备节点
SET synchronous_standby_names = 'standby1,standby2';
```

### 级联备节点

```bash
# standby2 的 primary_conninfo 指向 standby1
primary_conninfo = 'host=standby1 port=5432 user=replicator'
```

## Tips

**主备配置最佳实践**:
- 使用独立的复制用户
- 配置合适的同步模式
- 设置 WAL 保留参数
- 配置防火墙和网络
- 验证复制状态

**配置注意事项**:
- 主备时钟同步（NTP）
- 网络带宽和延迟
- 磁盘 I/O 性能
- 定期检查复制延迟

**企业规范**:
- [ ] 使用专用复制用户
- [ ] 配置网络和防火墙
- [ ] 设置合适的同步模式
- [ ] 配置 WAL 参数
- [ ] 验证复制状态
- [ ] 监控复制延迟
- [ ] 制定切换流程

## 任务

创建复制用户:

```sql
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'Repl@2024';
```

查看当前复制配置:

```sql
SHOW wal_level;
SHOW synchronous_commit;
SHOW synchronous_standby_names;
```

配置 pg_hba.conf:

```
host    replication     replicator        192.168.1.0/24       md5
```

查看复制状态:

```sql
SELECT
    application_name,
    client_addr,
    state,
    sync_state,
    replay_lag
FROM pg_stat_replication;
```

检查延迟:

```sql
SELECT
    now() - replay_timestamp AS lag_seconds
FROM pg_stat_replication;
```

## 错误演示

复制用户权限不足:

```sql
-- 如果 replicator 没有 REPLICATION 权限
CREATE USER replicator WITH PASSWORD 'pass';
```

说明: 复制用户必须有 REPLICATION 权限。

备节点未启动:

```sql
-- 只有一个连接（应用）
SELECT count(*) FROM pg_stat_replication;
```

说明: 备节点未启动，检查 standby.signal 和配置。
