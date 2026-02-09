# MGCA GaussDB 认证课程 - 默认环境配置文档

## 环境概述

本环境配置为 MGCA GaussDB 认证课程提供完整的培训环境，包括：

- GaussDB 主备高可用集群
- 监控系统（Prometheus + Grafana）
- 预装所有必要的数据库工具
- 数据持久化和备份支持
- 快照和回滚功能

## 快速开始

### 启动环境

```bash
cd courses/mgca/environments/default
docker-compose up -d
```

### 验证环境

```bash
# 检查服务状态
docker-compose ps

# 连接主库
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres

# 查看主备复制状态
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres -c "SELECT * FROM pg_stat_replication;"
```

### 访问服务

- **GaussDB 主库**: `localhost:5432`
- **GaussDB 备库**: `localhost:5433`
- **Grafana 监控界面**: `http://localhost:3000` (admin/admin123)
- **Prometheus**: `http://localhost:9090`

## 组件说明

### 1. GaussDB 主库 (gaussdb-primary)

- **端口**: 5432
- **用户**: omm
- **密码**: OpenGauss@123
- **数据目录**: /data/gaussdb
- **资源限制**: 2 vCPU, 4GB 内存

### 2. GaussDB 备库 (gaussdb-standby)

- **端口**: 5433
- **用户**: omm
- **密码**: OpenGauss@123
- **数据目录**: /data/gaussdb
- **资源限制**: 2 vCPU, 4GB 内存
- **复制模式**: 异步复制（可配置为同步）

### 3. Prometheus 监控

- **端口**: 9090
- **配置文件**: monitoring/prometheus.yml
- **数据保留**: 15 天
- **资源限制**: 0.5 vCPU, 1GB 内存

### 4. Grafana 可视化

- **端口**: 3000
- **管理员账号**: admin
- **管理员密码**: admin123
- **仪表板**: 预配置 GaussDB 监控仪表板
- **资源限制**: 0.5 vCPU, 1GB 内存

## 数据库配置

### 主库配置 (postgresql.conf)

关键配置项：

```bash
# 连接设置
max_connections = 200
superuser_reserved_connections = 3

# 内存设置
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 64MB
maintenance_work_mem = 512MB

# WAL 设置
wal_level = replica
wal_buffers = 64MB
checkpoint_timeout = 15min

# 归档设置
archive_mode = on
archive_command = 'test ! -f /data/backups/wal/%f && cp %p /data/backups/wal/%f'
archive_timeout = 300

# 复制设置
max_wal_senders = 10
max_replication_slots = 10
hot_standby = on

# 日志设置
log_min_duration_statement = 1000
logging_collector = on
```

### 访问控制 (pg_hba.conf)

```bash
# 本地连接
local   all             omm                                     trust
local   all             all                                     md5

# 主备复制
host    replication     omm             172.20.0.0/16           md5

# 应用连接
host    all             all             172.20.0.0/16           md5
```

## 预装工具

环境预装以下 GaussDB 工具：

| 工具 | 用途 | 示例 |
|------|------|------|
| gsql | 命令行客户端 | `gsql -h localhost -U omm -d postgres` |
| gs_ctl | 数据库控制 | `gs_ctl start -D /data/gaussdb` |
| gs_dump | 逻辑备份 | `gs_dump -h localhost -U omm -d postgres -f backup.sql` |
| gs_restore | 逻辑恢复 | `gs_restore -h localhost -U omm -d postgres -f backup.sql` |
| gs_basebackup | 物理备份 | `gs_basebackup -D /data/backup -Fp -Xs` |
| gs_check | 健康检查 | `gs_check -e inspect` |

## 资源配置

### 默认资源分配

| 组件 | CPU 限制 | 内存限制 | 磁盘 |
|------|----------|----------|------|
| 主库 | 2 vCPU | 4GB | 50GB |
| 备库 | 2 vCPU | 4GB | 50GB |
| 监控 | 0.5 vCPU | 1GB | 10GB |
| Grafana | 0.5 vCPU | 1GB | 5GB |

### 高负载配置（L3/L4 实验）

如需更高性能，可以修改 docker-compose.yml 中的资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 8G
    reservations:
      cpus: '2'
      memory: 4G
```

## 数据持久化

### 挂载点

- `/data/gaussdb` - 数据库数据文件
- `/data/backups` - 备份存储目录
- `/opt/scripts` - 自定义脚本目录
- `/data/gaussdb/log` - 日志文件

### 数据卷管理

```bash
# 查看数据卷
docker volume ls

# 创建快照
docker run --rm -v mgca-gaussdb-primary:/data -v $(pwd):/backup \
  busybox tar czf /backup/gaussdb-primary-backup.tar.gz /data

# 恢复快照
docker run --rm -v mgca-gaussdb-primary:/data -v $(pwd):/backup \
  busybox tar xzf /backup/gaussdb-primary-backup.tar.gz -C /
```

## 快照和回滚

### 创建快照脚本

创建 `scripts/snapshot.sh`:

```bash
#!/bin/bash
SNAPSHOT_DIR="/data/mgca/snapshots"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_NAME="mgca_env_${TIMESTAMP}"

echo "Creating snapshot: $SNAPSHOT_NAME"
mkdir -p $SNAPSHOT_DIR

# 停止服务
docker-compose stop

# 备份数据卷
docker run --rm -v mgca-gaussdb-primary:/data -v ${SNAPSHOT_DIR}:/backup \
  busybox tar czf /backup/${SNAPSHOT_NAME}_primary.tar.gz /data

# 重启服务
docker-compose start

echo "Snapshot created: $SNAPSHOT_NAME"
```

### 恢复快照脚本

创建 `scripts/restore.sh`:

```bash
#!/bin/bash
SNAPSHOT_NAME=$1
SNAPSHOT_DIR="/data/mgca/snapshots"

echo "Restoring snapshot: $SNAPSHOT_NAME"

# 停止服务
docker-compose down

# 恢复数据卷
docker run --rm -v mgca-gaussdb-primary:/data -v ${SNAPSHOT_DIR}:/backup \
  busybox tar xzf /backup/${SNAPSHOT_NAME}_primary.tar.gz -C /

# 启动服务
docker-compose up -d

echo "Snapshot restored: $SNAPSHOT_NAME"
```

## 监控和告警

### Prometheus 配置

配置文件位于 `monitoring/prometheus.yml`，包含：

- GaussDB 指标采集（使用 postgres_exporter）
- Node Exporter 系统指标
- cAdvisor 容器指标

### Grafana 仪表板

预配置的仪表板包括：

1. **GaussDB 概览** - 连接数、查询统计、锁等待
2. **查询性能** - 慢查询、查询时间分布
3. **系统资源** - CPU、内存、磁盘 I/O
4. **主备复制** - 复制延迟、WAL 大小

### 访问 Grafana

1. 浏览器访问 `http://localhost:3000`
2. 登录账号: admin / admin123
3. 查看 Dashboards 菜单选择 GaussDB 监控面板

## 网络配置

### 网络拓扑

```
mgca-network (172.20.0.0/16)
  ├── gaussdb-primary (172.20.0.2)
  ├── gaussdb-standby (172.20.0.3)
  ├── monitoring (172.20.0.4)
  └── grafana (172.20.0.5)
```

### 端口映射

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|----------|----------|------|
| GaussDB 主库 | 5432 | 5432 | 数据库连接 |
| GaussDB 备库 | 5432 | 5433 | 数据库连接 |
| Web 管理界面 | 8080 | 8080 | Web UI |
| Prometheus | 9090 | 9090 | 监控数据 |
| Grafana | 3000 | 3000 | 监控界面 |

## 常用命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs gaussdb-primary

# 实时跟踪日志
docker-compose logs -f

# 查看最近 100 行
docker-compose logs --tail=100
```

### 进入容器

```bash
# 进入主库容器
docker exec -it mgca-gaussdb-primary bash

# 连接数据库
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres
```

### 停止和启动

```bash
# 停止所有服务
docker-compose stop

# 停止特定服务
docker-compose stop gaussdb-standby

# 启动所有服务
docker-compose start

# 重启服务
docker-compose restart
```

### 清理环境

```bash
# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷（慎用！）
docker-compose down -v

# 删除未使用的资源
docker system prune -a
```

## 故障排查

### 容器无法启动

```bash
# 检查容器状态
docker-compose ps

# 查看容器日志
docker-compose logs <service_name>

# 检查资源使用
docker stats
```

### 连接失败

```bash
# 检查端口监听
netstat -tlnp | grep 5432

# 测试连接
gsql -h localhost -p 5432 -U omm -d postgres

# 检查防火墙
iptables -L -n
```

### 性能问题

```bash
# 查看慢查询
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres \
  -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 查看锁等待
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres \
  -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

## 安全建议

1. **修改默认密码**

```bash
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres \
  -c "ALTER USER omm WITH PASSWORD 'NewStrongPassword@123';"
```

2. **限制网络访问**

使用防火墙规则限制外部访问数据库端口：

```bash
iptables -A INPUT -p tcp --dport 5432 -s <trusted_ip> -j ACCEPT
iptables -A INPUT -p tcp --dport 5432 -j DROP
```

3. **定期更新镜像**

```bash
docker pull gaussdb:5.0.0-enterprise
docker-compose down
docker-compose up -d
```

## 环境变量

### 必需变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| GS_PASSWORD | OpenGauss@123 | 数据库密码 |
| GS_USERNAME | omm | 数据库用户名 |
| GS_DBNAME | postgres | 默认数据库名 |
| GS_PORT | 5432 | 数据库端口 |

### 可选变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| GS_LOCALE | en_US.UTF-8 | 数据库字符集 |
| GS_ENCODING | UTF8 | 数据库编码 |
| TZ | Asia/Shanghai | 时区设置 |

## 备份策略

### 备份计划

- **完整物理备份**: 每日凌晨 2:00
- **逻辑备份**: 每 6 小时
- **WAL 归档**: 实时归档（5 分钟）
- **保留期**: 7 天

### 手动备份

```bash
# 物理备份
docker exec -it mgca-gaussdb-primary gs_basebackup \
  -D /data/backups/base_$(date +%Y%m%d) -Fp -Xs -P

# 逻辑备份
docker exec -it mgca-gaussdb-primary gs_dump \
  -h localhost -U omm -d postgres -f /data/backups/dump_$(date +%Y%m%d).sql
```

## 更新和维护

### 更新镜像

```bash
# 拉取最新镜像
docker pull gaussdb:5.0.0-enterprise

# 重启服务
docker-compose down
docker-compose up -d
```

### 数据库维护

```bash
# 更新统计信息
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres \
  -c "ANALYZE;"

# 执行 VACUUM
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres \
  -c "VACUUM ANALYZE;"

# 重建索引
docker exec -it mgca-gaussdb-primary gsql -h localhost -U omm -d postgres \
  -c "REINDEX DATABASE postgres;"
```

## 扩展阅读

- [GaussDB 官方文档](https://opengauss.org/zh/docs/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 文档](https://grafana.com/docs/)

## 支持

如有问题，请联系：

- **课程讲师**: [讲师邮箱]
- **技术支持**: [支持邮箱]
- **问题反馈**: [Issue Tracker]
