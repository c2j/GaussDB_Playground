# MGCA 自定义环境配置示例

本目录包含针对不同实验场景的自定义环境配置。

## 可用环境

### 1. 性能测试环境 (performance-lab/)

适用于性能优化、压力测试、查询调优实验。

**特点**:
- 更高的 CPU 和内存分配
- 更大的数据集
- 优化的参数配置
- 禁用慢查询日志（减少性能影响）

**资源配置**:
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

**使用方法**:
```bash
cd performance-lab
docker-compose up -d
```

### 2. 高可用实验环境 (ha-lab/)

适用于主备复制、故障切换、容灾实验。

**特点**:
- 完整的主备集群（1 主 2 备）
- 同步复制配置
- 自动故障切换脚本
- 跨区域网络模拟

**组件**:
- GaussDB 主库 × 1
- GaussDB 备库 × 2
- 故障切换控制器 × 1
- 健康检查服务 × 1

**使用方法**:
```bash
cd ha-lab
docker-compose up -d
```

### 3. 安全测试环境 (security-lab/)

适用于安全加固、审计、权限管理实验。

**特点**:
- 启用完整审计日志
- 多角色多用户配置
- 行级安全策略预配置
- 数据加密启用

**安全配置**:
```bash
audit_enabled = on
audit_directory = '/data/gaussdb/audit'
audit_rotation_age = 1d
audit_rotation_size = 100MB
```

**使用方法**:
```bash
cd security-lab
docker-compose up -d
```

### 4. 备份恢复环境 (backup-lab/)

适用于备份策略、恢复流程、PITR 实验。

**特点**:
- WAL 归档自动配置
- 定时备份任务（cron）
- 多种备份类型支持
- 恢复测试脚本

**备份配置**:
```bash
archive_mode = on
archive_command = 'cp %p /data/backups/wal/%f'
archive_timeout = 300
```

**使用方法**:
```bash
cd backup-lab
docker-compose up -d
```

## 创建自定义环境

### 步骤 1: 复制默认环境

```bash
cp -r default my-custom-env
cd my-custom-env
```

### 步骤 2: 修改 docker-compose.yml

根据实验需求调整资源配置：

```yaml
services:
  gaussdb-primary:
    image: gaussdb:5.0.0-enterprise
    deploy:
      resources:
        limits:
          cpus: '4'        # 修改 CPU 限制
          memory: 8G        # 修改内存限制
```

### 步骤 3: 自定义数据库配置

创建 `config/postgresql.conf`:

```bash
# 内存配置
shared_buffers = 4GB
work_mem = 128MB

# 性能调优
random_page_cost = 1.1
effective_io_concurrency = 200

# 日志配置
log_min_duration_statement = 500   # 修改慢查询阈值
```

在 docker-compose.yml 中挂载配置：

```yaml
volumes:
  - ./config/postgresql.conf:/data/gaussdb/postgresql.conf
```

### 步骤 4: 添加自定义脚本

创建 `scripts/custom-setup.sh`:

```bash
#!/bin/bash
# 自定义初始化脚本

# 创建测试数据库
gsql -h localhost -U omm -d postgres -c "CREATE DATABASE test_lab;"

# 创建测试用户
gsql -h localhost -U omm -d postgres -c "CREATE USER lab_user WITH PASSWORD 'LabUser@123';"

# 授予权限
gsql -h localhost -U omm -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE test_lab TO lab_user;"
```

在 docker-compose.yml 中添加初始化：

```yaml
services:
  gaussdb-primary:
    volumes:
      - ./scripts:/docker-entrypoint-initdb.d
```

### 步骤 5: 测试环境

```bash
docker-compose up -d
docker-compose ps
docker-compose logs
```

## 环境定制指南

### CPU 调整

根据实验类型调整 CPU 资源：

| 实验类型 | 建议配置 |
|----------|----------|
| 基础实验（L1） | 1 vCPU |
| 进阶实验（L2） | 2 vCPU |
| 高级实验（L3） | 4 vCPU |
| 专家实验（L4） | 8 vCPU |

### 内存调整

根据数据量和并发调整内存：

| 数据规模 | 建议配置 |
|----------|----------|
| < 1GB | 2GB |
| 1-10GB | 4GB |
| 10-100GB | 8GB |
| > 100GB | 16GB |

### 网络配置

多节点实验需要网络隔离：

```yaml
networks:
  primary-net:
    ipam:
      config:
        - subnet: 172.21.0.0/24
  standby-net:
    ipam:
      config:
        - subnet: 172.22.0.0/24
```

### 存储配置

大表实验需要更大的存储：

```yaml
volumes:
  gaussdb-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/large-storage  # 使用大容量存储路径
```

## 常见定制场景

### 场景 1: 模拟生产环境

```yaml
deploy:
  resources:
    limits:
      cpus: '8'
      memory: 16G
  replicas: 1
```

### 场景 2: 资源受限环境

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 2G
  replicas: 1
```

### 场景 3: 多租户环境

```yaml
services:
  tenant1-db:
    image: gaussdb:5.0.0-enterprise
    container_name: tenant1-db
  tenant2-db:
    image: gaussdb:5.0.0-enterprise
    container_name: tenant2-db
```

### 场景 4: 分布式集群

```yaml
services:
  gaussdb-node1:
    container_name: gaussdb-node1
    environment:
      - NODE_ID=1
  gaussdb-node2:
    container_name: gaussdb-node2
    environment:
      - NODE_ID=2
  gaussdb-node3:
    container_name: gaussdb-node3
    environment:
      - NODE_ID=3
```

## 环境验证

### 健康检查

```bash
# 检查所有容器状态
docker-compose ps

# 检查数据库连接
docker exec -it <container_name> gsql -h localhost -U omm -d postgres -c "SELECT 1;"

# 检查资源使用
docker stats
```

### 功能验证

```bash
# 验证备份功能
docker exec -it <container_name> gs_dump -h localhost -U omm -d postgres -f /tmp/test.sql

# 验证复制功能
docker exec -it <container_name> gsql -h localhost -U omm -d postgres -c "SELECT * FROM pg_stat_replication;"

# 验证审计功能
docker exec -it <container_name> ls -la /data/gaussdb/audit/
```

## 环境清理

### 删除单个环境

```bash
cd my-custom-env
docker-compose down
docker-compose down -v  # 同时删除数据卷
```

### 清理所有环境

```bash
docker system prune -a
```

## 故障排查

### 容器启动失败

```bash
# 查看详细错误
docker-compose logs <service_name>

# 检查资源限制
docker inspect <container_name> | grep -A 10 "Resources"

# 检查配置文件
docker exec -it <container_name> cat /data/gaussdb/postgresql.conf
```

### 连接问题

```bash
# 检查端口监听
docker exec -it <container_name> netstat -tlnp

# 检查防火墙
iptables -L -n

# 测试连接
docker exec -it <container_name> gsql -h localhost -U omm -d postgres
```

### 性能问题

```bash
# 检查资源使用
docker stats

# 检查数据库统计
docker exec -it <container_name> gsql -h localhost -U omm -d postgres \
  -c "SELECT * FROM pg_stat_activity;"

# 查看慢查询
docker exec -it <container_name> gsql -h localhost -U omm -d postgres \
  -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

## 最佳实践

1. **使用命名规范**
   - 容器名: `<用途>-<版本>` (如: performance-test-v1)
   - 网络名: `<用途>-net` (如: ha-lab-net)
   - 卷名: `<用途>-data` (如: backup-lab-data)

2. **文档化配置**
   - 在 README.md 中记录配置目的
   - 注释 docker-compose.yml 中的关键配置
   - 保留配置变更历史

3. **版本控制**
   - 将自定义环境纳入 Git 管理
   - 使用 .gitignore 排除敏感数据和日志
   - 使用标签标记不同版本

4. **资源限制**
   - 始终设置资源上限
   - 为关键服务预留资源
   - 避免资源争用

5. **安全考虑**
   - 不要在生产配置中使用默认密码
   - 限制容器网络访问
   - 定期更新镜像和配置

## 扩展阅读

- [Docker Compose 文档](https://docs.docker.com/compose/)
- [GaussDB 配置参数](https://opengauss.org/zh/docs/docs/opengauss/server/2.0.0/zh-cn/docs/ConfiguringServerConfiguration/ConfigurationParameters.html)
- [Docker 资源管理](https://docs.docker.com/config/containers/resource_constraints/)

## 支持和反馈

如有问题或建议，请联系：

- **课程讲师**: [讲师邮箱]
- **技术支持**: [支持邮箱]
- **问题反馈**: [Issue Tracker]
