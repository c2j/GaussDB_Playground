### 数据导入导出

数据导入导出是日常运维中的重要任务，涉及备份恢复、数据迁移、数据交换等场景。本步骤介绍openGauss的数据导入导出工具。

#### 核心工具

**1. gs_dump - 逻辑导出工具**

导出整个数据库：
[[gs_dump -U omm -W password -F p banking_db > banking_db_backup.sql]]{{RUN}}

导出指定表：
[[gs_dump -U omm -W password -t transactions -F p banking_db > transactions_backup.sql]]{{RUN}}

导出指定模式：
[[gs_dump -U omm -W password -n public -F c banking_db > banking_db_backup.dump]]{{RUN}}

**参数说明**:
- `-U`: 用户名
- `-W`: 密码
- `-F`: 格式（p=纯SQL, c=自定义, d=目录, t=tar）
- `-t`: 指定表
- `-n`: 指定模式

**2. gs_restore - 逻辑导入工具**

从SQL文件导入：
[[gs_restore -U omm -W password -d target_db banking_db_backup.sql]]{{RUN}}

从dump文件导入：
[[gs_restore -U omm -W password -d target_db -j 4 banking_db_backup.dump]]{{RUN}}

**参数说明**:
- `-j`: 并行线程数，可提升导入速度

**3. gsql - 交互式客户端**

从文件执行SQL：
[[gsql -U omm -W password -d banking_db -f import_script.sql]]{{RUN}}

**最佳实践**: 对于大规模数据迁移，使用`-j`参数启用并行导入，可显著提升性能。

#### 金融场景：批量数据迁移

银行遗留系统迁移到openGauss的方案：

**阶段1: 数据准备**
```sql
-- 创建目标表结构
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY,
    account_id VARCHAR(50),
    amount DECIMAL(20,2),
    transaction_time TIMESTAMP,
    ...
);
```

**阶段2: 数据导出**
[[gs_dump -U oracle_user -W oracle_pass -t old_transactions -F c legacy_db > transactions.dump]]{{RUN}}

**阶段3: 数据转换**
使用ETL工具处理数据格式转换（日期格式、编码等）

**阶段4: 数据导入**
[[gs_restore -U omm -W password -d banking_db -j 8 transactions.dump]]{{RUN}}

**阶段5: 数据验证**
```sql
-- 验证数据完整性
SELECT COUNT(*) FROM transactions;
-- 对比源系统数据量
```

#### 性能优化建议

1. **批量操作**: 使用批量INSERT而非单条插入
2. **禁用索引**: 导入前禁用索引，导入后重建
3. **调整参数**: 增大maintenance_work_mem、work_mem
4. **并行处理**: 使用并行导入导出
5. **事务控制**: 大数据导入分批提交事务

## 任务

1. 创建测试表：
[[create table test_import (id int, name varchar(100));]]{{RUN}}

2. 插入测试数据：
[[insert into test_import select generate_series(1,1000), 'test'||generate_series(1,1000);]]{{RUN}}

3. 导出数据：
[[gs_dump -U omm -W password -t test_import -F p banking_db > test_export.sql]]{{RUN}}

4. 验证导出文件：
[[cat test_export.sql | head -20]]{{PRINT}}

5. 删除表：
[[drop table test_import;]]{{RUN}}

6. 从导出文件导入：
[[gsql -U omm -W password -d banking_db -f test_export.sql]]{{RUN}}

7. 验证导入结果：
[[select count(*) from test_import;]]{{RUN}}

**验证结果**: 导入后的记录数应与导出前一致（1000条）。

**规范CheckList**:
- [ ] 掌握gs_dump的常用参数
- [ ] 掌握gs_restore的使用方法
- [ ] 理解数据迁移的完整流程
- [ ] 了解性能优化的关键点
- [ ] 能够处理大规模数据迁移场景
- [ ] 掌握数据验证的方法

[验证结果]：自评你的答案是否覆盖关键点。
