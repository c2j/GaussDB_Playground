# 安装要求和准备

## 硬件要求

### CPU 要求
- **最低配置**: 2核 CPU
- **推荐配置**: 4核或以上
- **生产环境**: 8核或以上（根据并发量调整）

### 内存要求
- **最低配置**: 4GB RAM
- **推荐配置**: 8GB RAM
- **生产环境**: 16GB或以上
- **说明**: shared_buffers 通常设置为系统内存的 25%-40%

### 磁盘要求
- **系统盘**: 最少 20GB 可用空间
- **数据盘**: 根据数据量预留，建议预留 2-3倍数据空间
- **WAL 日志**: 建议单独磁盘或分区，至少 10GB
- **备份空间**: 至少与数据库大小相同的额外空间

### 网络要求
- **网络带宽**: 稳定的网络连接
- **端口要求**:
  - 数据库端口: 5432（可配置）
  - 内部通信端口: 5433, 5434 等
- **防火墙**: 确保必要端口已开放

## 软件要求

### 操作系统
- **支持的系统**: CentOS 7.6+、EulerOS、openEuler
- **内核版本**: 建议使用 3.10 或更高版本
- **文件系统**: XFS 或 EXT4（推荐 XFS）

### 依赖软件
- **Python**: Python 3.6 或更高版本
- **Java**: Java 1.8 或更高版本（用于某些工具）
- **其他依赖**: libaio, numactl, readline, zlib

### 用户和组
- **操作系统用户**: 创建专门的数据库用户（如 omm）
- **用户组**: 创建数据库用户组（如 dbgrp）
- **权限**: 用户需要有足够的系统权限

## 系统配置

### 内核参数调整

编辑 `/etc/sysctl.conf` 文件：

```bash
# 共享内存设置
kernel.shmmax = 4294967296  # 4GB
kernel.shmall = 4194304        # 4GB / 4KB

# 网络参数
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30

# 文件描述符
fs.file-max = 6815744

# 虚拟内存
vm.swappiness = 1
vm.dirty_ratio = 90
vm.dirty_background_ratio = 5
```

应用内核参数：

`[[sysctl -p]]{{RUN}}`

### 用户资源限制

编辑 `/etc/security/limits.conf` 文件：

```
omm soft nofile 65536
omm hard nofile 65536
omm soft nproc 65536
omm hard nproc 65536
omm soft memlock unlimited
omm hard memlock unlimited
```

### 文件系统挂载

检查文件系统：

`[[df -h]]{{RUN}}`

如果可能，使用以下挂载选项：
- noatime: 不更新访问时间
- nodiratime: 不更新目录访问时间
- barrier=0: 禁用 barrier（如果使用 RAID 控制器）

## 目录结构规划

### 推荐目录结构

```
/opt/gaussdb/              # GaussDB 安装目录
/opt/gaussdb/data/         # 数据目录
/opt/gaussdb/log/          # 日志目录
/opt/gaussdb/tmp/          # 临时文件目录
/opt/gaussdb/tool/         # 工具目录
```

### 目录权限

`[[chown -R omm:dbgrp /opt/gaussdb]]{{RUN}}`

`[[chmod -R 750 /opt/gaussdb]]{{RUN}}`

## 网络配置

### 主机名解析

编辑 `/etc/hosts` 文件：

```
127.0.0.1   localhost
192.168.1.100   gaussdb-server
```

### 主机名设置

`[[hostname gaussdb-server]]{{RUN}}`

永久设置（编辑 `/etc/hostname`）：

`[[echo "gaussdb-server" > /etc/hostname]]{{RUN}}`

## 理论验证

合理的系统准备是成功安装和稳定运行 GaussDB 的基础。硬件、软件和系统配置都需要根据业务场景进行优化。

## Tips

**生产环境建议**：
- 使用单独的数据盘和日志盘
- 配置 RAID 10 或 RAID 5 以提高数据安全性
- 使用 UPS 不间断电源保护硬件
- 配置监控系统及时发现问题
- 定期检查系统资源使用情况

**常见问题**：
- **内存不足**: shared_buffers 设置过大会导致启动失败
- **文件描述符不足**: 高并发场景下连接失败
- **磁盘 I/O 瓶颈**: 查询和事务性能下降
- **网络问题**: 分布式部署时连接不稳定

**企业规范 Checklist**：
- [ ] 评估硬件配置是否满足需求
- [ ] 配置合适的内核参数
- [ ] 设置用户资源限制
- [ ] 规划合理的目录结构
- [ ] 配置网络和主机名
- [ ] 准备足够的磁盘空间
- [ ] 配置监控和告警系统

## 任务

检查系统信息：

`[[cat /etc/os-release]]{{RUN}}`

检查内核版本：

`[[uname -r]]{{RUN}}`

检查 CPU 和内存：

`[[lscpu | head -20]]{{RUN}}`

`[[free -h]]{{RUN}}`

检查磁盘空间：

`[[df -h]]{{RUN}}`

检查文件描述符限制：

`[[ulimit -n]]{{RUN}}`

检查共享内存配置：

`[[cat /proc/sys/kernel/shmmax]]{{RUN}}`

`[[cat /proc/sys/kernel/shmall]]{{RUN}}`

检查当前用户：

`[[whoami]]{{RUN}}`

`[[id]]{{RUN}}`

## 错误演示

尝试使用不满足要求的系统配置：

1. 内存不足时启动 GaussDB 会失败
2. 文件描述符不足时会报错 "Too many open files"
3. 共享内存不足时会报错 "cannot allocate shared memory"

说明：在安装前必须确保系统配置满足 GaussDB 的最低要求。
