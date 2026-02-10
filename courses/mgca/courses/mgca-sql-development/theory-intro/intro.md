## 学习目标

本章节将帮助您掌握 GaussDB 的 SQL 开发技能，从基础语法到高级特性，全面提升您的数据库开发能力。

**学完本章，您将能够：**
- 熟练使用 SQL 数据类型和基础语法
- 掌握 DDL 操作（CREATE, ALTER, DROP）
- 熟练使用 DML 操作（INSERT, UPDATE, DELETE）
- 掌握复杂查询和表连接
- 了解高级 SQL 特性（CTEs, 窗口函数）
- 编写高效的 SQL 语句

## 业务场景

**电商平台的订单管理系统**

某电商平台需要开发订单管理系统，包含以下功能：
- 用户信息管理（用户注册、资料修改）
- 商品信息管理（商品录入、库存更新）
- 订单处理（订单创建、状态更新、查询统计）
- 数据报表（销售统计、用户行为分析）

开发团队需要：
1. 设计合理的数据库表结构
2. 实现完整的 CRUD 操作
3. 开发复杂查询和报表功能
4. 优化 SQL 性能以满足高并发访问

通过本章学习，您将能够：
- 使用合适的数据类型设计表结构
- 实现完整的增删改查操作
- 编写复杂的连接查询和聚合查询
- 使用窗口函数实现高级分析功能
- 优化 SQL 查询性能

**金融系统案例：银行交易性能问题**

某银行在生产环境中遇到严重的数据库性能问题，交易处理延迟达到 5-8 秒，严重影响用户体验和业务运营。

**问题现象**:
- 高峰期交易响应时间超过 8 秒
- 数据库 CPU 使用率达到 90%
- 大量锁等待和长事务
- 客户频繁投诉交易失败

**问题分析**:
1. **索引设计不合理**：
   - 订单表缺少关键索引
   - 复合查询未能利用索引
   - 导致大量全表扫描

2. **数据倾斜**：
   - 热点账户（如大客户）数据集中存储
   - 导致单节点负载过高
   - 并发争用严重

3. **查询效率问题**：
   - 使用 N+1 查询（子查询循环）
   - 缺乏查询缓存
   - 大量重复计算

4. **连接池配置不当**：
   - 连接数过多导致资源竞争
   - 等待连接时间过长

**解决方案**:
1. **优化索引策略**：
   ```sql
   -- 为常用查询条件创建索引
   CREATE INDEX idx_order_account_id ON orders(account_id);
   CREATE INDEX idx_order_date ON orders(order_date);
   CREATE INDEX idx_order_status ON orders(status, order_date);
   
   -- 创建复合索引
   CREATE INDEX idx_account_status_date ON transactions(account_id, status, trans_date);
   
   -- 分析索引使用情况
   EXPLAIN SELECT * FROM orders WHERE account_id = 'ACC123456';
   ```

2. **实施分区表**：
   ```sql
   -- 按账户 ID 范围分区，避免数据倾斜
   CREATE TABLE transactions (
       id BIGINT,
       account_id VARCHAR(20),
       amount NUMERIC(18,2),
       trans_date TIMESTAMP,
       status VARCHAR(20)
   ) PARTITION BY RANGE (account_id) (
       PARTITION p_001 VALUES LESS THAN ('ACC100000'),
       PARTITION p_002 VALUES LESS THAN ('ACC200000'),
       PARTITION p_003 VALUES LESS THAN ('ACC300000'),
       PARTITION p_max VALUES LESS THAN (MAXVALUE)
   );
   ```

3. **优化查询语句**：
   ```sql
   -- 使用 JOIN 替代 N+1 查询
   SELECT t.*
   FROM transactions t
   INNER JOIN accounts a ON t.account_id = a.id
   WHERE a.status = 'ACTIVE'
     AND t.trans_date >= CURRENT_DATE - INTERVAL '30 days';
   
   -- 使用窗口函数替代自连接
   SELECT 
       id,
       account_id,
       amount,
       trans_date,
       AVG(amount) OVER (PARTITION BY account_id ORDER BY trans_date ROWS BETWEEN UNBOUNDED PRECEDING AND 10) AS avg_amount
   FROM transactions
   WHERE account_id = 'ACC123456';
   ```

4. **配置查询缓存**：
   ```sql
   -- 启用服务器端预编译
   PREPARE get_account_balance(INT) AS
       SELECT SUM(amount) FROM transactions WHERE account_id = $1;
   
   EXECUTE get_account_balance('ACC123456');
   ```

5. **调优连接参数**：
   ```bash
   -- postgresql.conf
   max_connections = 500
   shared_buffers = 16GB
   effective_cache_size = 8GB
   work_mem = 256MB
   ```

**性能提升效果**:
- 交易响应时间从 5-8 秒降至 0.1-0.3 秒
- CPU 使用率从 90% 降至 30-40%
- 锁等待减少 80%
- 高峰期性能提升 10 倍以上

**最佳实践清单**:
- [ ] 定期更新统计信息 (ANALYZE)
- [ ] 监控慢查询并优化
- [ ] 使用 EXPLAIN 分析执行计划
- [ ] 合理设计表结构避免数据倾斜
- [ ] 实施分区策略处理大规模数据
- [ ] 配置合理的连接池
- [ ] 建立性能基线和告警

通过分析此案例，学习如何在金融场景下优化数据库性能，确保高并发下的交易处理效率。



## 学习内容

本章节包含以下步骤：
1. **SQL 基础和数据类型** - 数据类型、常量、运算符
2. **DDL 操作** - 创建表、修改表结构、删除表
3. **DML 操作** - 插入、更新、删除数据
4. **查询和连接** - 基础查询、表连接、聚合查询
5. **高级 SQL 特性** - CTEs、窗口函数、递归查询

<font color=darkred>*注意: 本章节假设您已经完成"GaussDB 架构与原理"和"安装与配置"章节的学习*</font>

## 前置要求

- 完成"GaussDB 架构与原理"章节
- 完成"安装与配置"章节
- 能够使用 gsql 工具连接数据库
- 了解基本的数据库概念（表、字段、主键等）
