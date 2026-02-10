# 安装后配置

## 基础配置

### 连接数据库

使用 gsql 工具连接数据库：

`[[gsql -d postgres -p 5432]]{{RUN}}`

### 修改管理员密码

切换到 postgres 数据库：

```
[[\c postgres]]{{RUN}}
```

修改数据库密码：

`[[ALTER USER omm WITH PASSWORD 'NewStrongPassword@2024';]]{{RUN}}`

### 创建用户和数据库

创建普通用户：

`[[CREATE USER app_user WITH PASSWORD 'AppPassword@2024';]]{{RUN}}`

授予必要权限：

`[[GRANT CONNECT ON DATABASE postgres TO app_user;]]{{RUN}}`

创建应用数据库：

`[[CREATE DATABASE app_db OWNER app_user;]]{{RUN}}`

## 网络配置

### 监听地址配置

编辑 `postgresql.conf` 文件：

`[[cat /opt/gaussdb/data/postgresql.conf | grep listen_addresses]]{{RUN}}`

修改监听地址：

```
[[
echo "listen_addresses = '*'"'"'' >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

### 端口配置

检查当前端口配置：

`[[cat /opt/gaussdb/data/postgresql.conf | grep port]]{{RUN}}`

修改端口（如果需要）：

```
[[
echo "port = 5432" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

### pg_hba.conf 配置

编辑 `pg_hba.conf` 文件以允许远程连接：

`[[cat /opt/gaussdb/data/pg_hba.conf | tail -10]]{{RUN}}`

添加远程访问规则：

```
[[
echo "host    all             all             192.168.1.0/24          md5" >> /opt/gaussdb/data/pg_hba.conf
]]{{RUN}}
```

重启数据库使配置生效：

`[[gs_ctl restart]]{{RUN}}`

## 日志配置

### 日志级别

查看当前日志配置：

`[[cat /opt/gaussdb/data/postgresql.conf | grep log_level]]{{RUN}}`

设置日志级别：

```
[[
echo "log_level = warning" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

日志级别选项：
- debug5: 最详细
- debug1: 详细调试
- info: 一般信息
- warning: 警告信息（推荐生产环境）
- error: 只记录错误

### 日志轮转

配置日志轮转：

```
[[
echo "log_rotation_age = 1d" >> /opt/gaussdb/data/postgresql.conf
echo "log_rotation_size = 100MB" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

### 慢查询日志

启用慢查询日志：

```
[[
echo "log_min_duration_statement = 1000" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

这会记录执行时间超过 1000ms 的查询。

## 内存配置

### shared_buffers

查看当前配置：

`[[cat /opt/gaussdb/data/postgresql.conf | grep shared_buffers]]{{RUN}}`

设置 shared_buffers（通常为系统内存的 25%-40%）：

```
[[
echo "shared_buffers = 2GB" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

### work_mem

查看当前配置：

`[[cat /opt/gaussdb/data/postgresql.conf | grep work_mem]]{{RUN}}`

设置 work_mem（排序和哈希操作使用）：

```
[[
echo "work_mem = 64MB" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

### maintenance_work_mem

查看当前配置：

`[[cat /opt/gaussdb/data/postgresql.conf | grep maintenance_work_mem]]{{RUN}}`

设置 maintenance_work_mem（VACUUM、索引创建使用）：

```
[[
echo "maintenance_work_mem = 256MB" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

## WAL 配置

### WAL 级别

查看当前配置：

`[[cat /opt/gaussdb/data/postgresql.conf | grep wal_level]]{{RUN}}`

设置 WAL 级别：

```
[[
echo "wal_level = replica" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

WAL 级别：
- minimal: 最少 WAL 日志
- replica: 支持归档和复制
- logical: 支持逻辑解码

### WAL 缓冲区

查看当前配置：

`[[cat /opt/gaussdb/data/postgresql.conf | grep wal_buffers]]{{RUN}}`

设置 wal_buffers：

```
[[
echo "wal_buffers = 16MB" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

### 检查点配置

设置检查点参数：

```
[[
echo "checkpoint_timeout = 5min" >> /opt/gaussdb/data/postgresql.conf
echo "checkpoint_completion_target = 0.5" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

## 安全配置

### 密码策略

修改 postgresql.conf 中的密码策略：

```
[[
echo "password_encryption_type = 0" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

### 连接限制

设置最大连接数：

```
[[
echo "max_connections = 500" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

### 空闲超时

设置空闲连接超时：

```
[[
echo "idle_in_transaction_session_timeout = 10min" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

## 重启验证

重启数据库应用所有配置：

`[[gs_ctl restart]]{{RUN}}`

检查数据库状态：

`[[gs_ctl status]]{{RUN}}`

验证配置：

`[[gsql -d postgres -p 5432 -c "SHOW shared_buffers;"]]{{RUN}}`

`[[gsql -d postgres -p 5432 -c "SHOW max_connections;"]]{{RUN}}`

`[[gsql -d postgres -p 5432 -c "SHOW log_level;"]]{{RUN}}`

## 理论验证

安装后的配置对数据库性能、安全性和可靠性至关重要。合理的配置需要根据业务场景和硬件资源进行优化。

## Tips

**生产环境建议**：
- 在生产环境应用配置前，先在测试环境验证
- 配置修改后记录修改时间和原因
- 定期备份配置文件
- 监控配置修改对性能的影响
- 遵循最小权限原则配置访问控制

**配置优化原则**：
- **渐进式修改**: 一次只修改一个参数
- **监控效果**: 观察配置修改后的性能变化
- **保留记录**: 记录所有配置修改
- **测试验证**: 在测试环境验证配置效果

**常见问题**：
- **配置错误**: 导致数据库无法启动
- **参数过大**: 内存不足导致启动失败
- **权限问题**: 配置文件权限不正确
- **语法错误**: 配置文件语法错误

**企业规范 Checklist**：
- [ ] 修改默认管理员密码
- [ ] 创建应用专用用户
- [ ] 配置合理的监听地址和端口
- [ ] 配置远程访问控制（pg_hba.conf）
- [ ] 启用适当的日志级别
- [ ] 配置慢查询日志
- [ ] 优化内存参数
- [ ] 配置 WAL 参数
- [ ] 设置安全相关参数
- [ ] 重启验证配置生效
- [ ] 备份最终配置文件

## 任务

连接数据库：

`[[gsql -d postgres -p 5432]]{{RUN}}`

查看当前配置：

`[[SHOW ALL;]]{{PRINT}}`

修改密码：

`[[ALTER USER omm WITH PASSWORD 'NewGauss@2024';]]{{RUN}}`

创建测试用户：

`[[CREATE USER test_user WITH PASSWORD 'Test@2024';]]{{RUN}}`

授予连接权限：

`[[GRANT CONNECT ON DATABASE postgres TO test_user;]]{{RUN}}`

查看 pg_hba.conf：

`[[cat /opt/gaussdb/data/pg_hba.conf]]{{PRINT}}`

查看 postgresql.conf 配置：

`[[cat /opt/gaussdb/data/postgresql.conf | grep -E "^(shared_buffers|work_mem|max_connections)" ]]{{RUN}}`

重启数据库：

`[[gs_ctl restart]]{{RUN}}`

验证重启成功：

`[[gs_ctl status]]{{RUN}}`

连接测试：

`[[gsql -h 127.0.0.1 -p 5432 -U test_user -d postgres]]{{RUN}}`

**自动评分**：验证配置是否正确应用，数据库是否可以正常连接。

## 错误演示

尝试设置过大的 shared_buffers：

```
[[
echo "shared_buffers = 100GB" >> /opt/gaussdb/data/postgresql.conf
]]{{RUN}}
```

重启数据库：

`[[gs_ctl restart]]{{RUN}}`

说明：shared_buffers 超过系统可用内存会导致数据库启动失败。应该设置为系统内存的 25%-40%。
