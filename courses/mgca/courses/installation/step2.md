# 安装流程

## 安装包准备

### 下载 GaussDB 安装包

从官方渠道下载 GaussDB 安装包：
- **版本**: GaussDB 5.0.0 企业版
- **架构**: x86_64 或 ARM64（根据硬件选择）
- **格式**: tar.gz 压缩包

### 验证安装包

校验安装包的 MD5 或 SHA256 哈希值：

`[[md5sum gaussdb-5.0.0-enterprise-x86_64.tar.gz]]{{RUN}}`

`[[sha256sum gaussdb-5.0.0-enterprise-x86_64.tar.gz]]{{RUN}}`

解压安装包：

`[[tar -zxvf gaussdb-5.0.0-enterprise-x86_64.tar.gz -C /opt/gaussdb/]]{{RUN}}`

## 单机安装

### 安装前检查

切换到数据库用户：

`[[su - omm]]{{RUN}}`

检查安装环境：

`[[/opt/gaussdb/tool/script/gs_checkos -i A -B Default]]{{RUN}}`

### 执行安装

使用 gs_install 脚本进行安装：

```
[[/opt/gaussdb/script/gs_install -U omm:dbgrp \
  -D /opt/gaussdb/data \
  -R /opt/gaussdb/data \
  -C /opt/gaussdb/log \
  -n 1 \
  -l \
  -X \
  -w ENCRYPTED_PASSWORD]]{{RUN}}
```

参数说明：
- `-U omm:dbgrp`: 运行用户和组
- `-D /opt/gaussdb/data`: 数据目录
- `-R /opt/gaussdb/data`: 数据根目录
- `-C /opt/gaussdb/log`: 日志目录
- `-n 1`: 节点数量（单机）
- `-l`: 本地安装模式
- `-X`: 启用加密
- `-w ENCRYPTED_PASSWORD`: 数据库密码

### 安装验证

检查安装是否成功：

`[[ps aux | grep gaussdb]]{{RUN}}`

查看 GaussDB 版本：

`[[/opt/gaussdb/bin/gsql --version]]{{RUN}}`

检查数据库服务状态：

`[[/opt/gaussdb/bin/gs_ctl status]]{{RUN}}`

## 主备安装

### 准备工作

**主节点准备**:
- 配置 `/etc/hosts` 文件，添加主备节点地址
- 准备主节点配置文件 postgresql.conf

**备节点准备**:
- 配置相同的 `/etc/hosts` 文件
- 准备备节点配置文件

### 主节点安装

在主节点上执行安装：

```
[[/opt/gaussdb/script/gs_install -U omm:dbgrp \
  -D /opt/gaussdb/data/master \
  -R /opt/gaussdb/data \
  -C /opt/gaussdb/log \
  -M gaussdb-master \
  -n 1 \
  -l \
  -X \
  -w ENCRYPTED_PASSWORD]]{{RUN}}
```

### 备节点安装

在备节点上执行安装：

```
[[/opt/gaussdb/script/gs_install -U omm:dbgrp \
  -D /opt/gaussdb/data/slave \
  -R /opt/gaussdb/data \
  -C /opt/gaussdb/log \
  -M gaussdb-slave \
  -n 1 \
  -l \
  -X \
  -w ENCRYPTED_PASSWORD \
  --replconninfo="replconninfo=host=gaussdb-master port=5432 user=replicator password=REPLICATOR_PASSWORD"]]{{RUN}}
```

### 主备关系验证

在主节点上查看备节点状态：

```
[[/opt/gaussdb/bin/gsql -d postgres -p 5432 -c "SELECT * FROM pg_stat_replication;"]]{{RUN}}
```

## 集群安装

### 集群规划

配置集群拓扑：
- **协调节点 (CN)**: 1-3 个
- **数据节点 (DN)**: 1-3 个（根据副本数）
- **集群管理 (CM)**: 1-2 个

### XML 配置文件

创建集群配置文件 `cluster_config.xml`：

```xml
<PARAM name="clusterConfig">
  <PARAM name="instanceName" value="gaussdb-cluster"/>
  <PARAM name="gaussdbAppPath" value="/opt/gaussdb/app"/>
  <PARAM name="gaussdbLogPath" value="/opt/gaussdb/log"/>
  <PARAM name="tmpMppdbPath" value="/opt/gaussdb/tmp"/>
  <PARAM name="gaussdbToolPath" value="/opt/gaussdb/tool"/>

  <!-- 协调节点配置 -->
  <PARAM name="cnList">
    <PARAM name="CN1" value="host1,5432,/opt/gaussdb/data/cn1"/>
    <PARAM name="CN2" value="host2,5432,/opt/gaussdb/data/cn2"/>
  </PARAM>

  <!-- 数据节点配置 -->
  <PARAM name="dnList">
    <PARAM name="DN1" value="host3,5432,/opt/gaussdb/data/dn1,host4,5433,/opt/gaussdb/data/dn1_standby"/>
  </PARAM>
</PARAM>
```

### 执行集群安装

使用 gs_install 安装集群：

```
[[/opt/gaussdb/script/gs_install \
  -U omm:dbgrp \
  -X cluster_config.xml \
  -l \
  -w ENCRYPTED_PASSWORD]]{{RUN}}
```

### 集群状态检查

查看集群状态：

`[[/opt/gaussdb/bin/gs_om -t status --detail]]{{RUN}}`

## 理论验证

GaussDB 支持多种安装模式（单机、主备、集群），应根据业务需求和可用性要求选择合适的部署方式。

## Tips

**生产环境建议**：
- 生产环境推荐使用主备或集群部署
- 配置合理的密码策略
- 安装后立即备份配置文件
- 记录安装过程和配置参数
- 使用脚本自动化安装流程

**安装模式选择**：
- **单机**: 适合开发测试、小规模应用
- **主备**: 适合一般生产环境，提供故障切换能力
- **集群**: 适合大规模分布式应用，提供高可用和负载均衡

**常见问题**：
- **权限不足**: 确保数据库用户有足够的目录权限
- **端口冲突**: 检查端口是否被占用
- **内存不足**: shared_buffers 设置过大
- **依赖缺失**: 安装前检查所有依赖软件

**企业规范 Checklist**：
- [ ] 验证安装包完整性和哈希值
- [ ] 检查系统配置满足要求
- [ ] 使用专门的数据库用户
- [ ] 配置合理的目录结构
- [ ] 设置强密码
- [ ] 备份配置文件
- [ ] 验证安装成功
- [ ] 配置监控和告警

## 任务

解压 GaussDB 安装包：

`[[tar -tzvf gaussdb-5.0.0-enterprise-x86_64.tar.gz -C /opt/gaussdb/]]{{PRINT}}`

检查安装脚本：

`[[ls -lh /opt/gaussdb/script/]]{{RUN}}`

执行安装前环境检查：

`[[/opt/gaussdb/tool/script/gs_checkos -i A -B Default]]{{RUN}}`

执行单机安装（模拟）：

```
[[/opt/gaussdb/script/gs_install \
  -U omm:dbgrp \
  -D /opt/gaussdb/data \
  -R /opt/gaussdb/data \
  -C /opt/gaussdb/log \
  -n 1 \
  -l \
  --skip-root-check \
  -w Gauss@1234]]{{RUN}}
```

检查 GaussDB 进程：

`[[ps aux | grep gaussdb | grep -v grep]]{{RUN}}`

检查 GaussDB 版本：

`[[/opt/gaussdb/bin/gsql --version]]{{RUN}}`

检查数据库连接：

`[[/opt/gaussdb/bin/gsql -d postgres -p 5432 -c "SELECT version();"]]{{RUN}}`

查看数据目录结构：

`[[ls -lh /opt/gaussdb/data/]]{{RUN}}`

**自动评分**：检查安装是否成功，GaussDB 服务是否正常运行。

## 错误演示

使用错误的参数安装：

1. 数据目录已存在时会报错
2. 用户权限不足时会报错 "Permission denied"
3. 端口被占用时会报错 "port already in use"

说明：在安装前需要仔细检查所有前提条件，确保参数配置正确。
