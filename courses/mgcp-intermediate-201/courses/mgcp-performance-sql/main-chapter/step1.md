### 性能诊断与EXPLAIN ANALYZE

性能诊断是优化的第一步，通过工具和方法识别性能瓶颈。

#### 1. EXPLAIN ANALYZE详解

**EXPLAIN**: 仅显示执行计划（不执行查询）
[[explain select * from transactions where account_id = 'ACC001';]]{{RUN}}

**EXPLAIN ANALYZE**: 实际执行并显示真实统计
[[explain analyze select * from transactions where account_id = 'ACC001';]]{{RUN}}

#### 2. 执行计划关键指标

- **cost**: 估算的执行成本（越低越好）
- **rows**: 估算的行数
- **actual time**: 实际执行时间
- **actual rows**: 实际返回行数
- **index scan**: 索引扫描（快）
- **seq scan**: 顺序扫描（慢）

#### 3. 常见性能问题

**问题1: 全表扫描**
```
-> Seq Scan on transactions (cost=0.00..12345.67 rows=1000000)
```
**优化**: 创建合适的索引

**问题2: 嵌套循环（Nested Loop）**
```
-> Nested Loop (cost=100.00..5000.00 rows=1000)
   -> Index Scan using idx_account_id on transactions
   -> Materialize
```
**优化**: 优化JOIN顺序或使用更好的JOIN算法

**问题3: 高过滤率**
```
Filter: (amount > 1000) (rows=500/1000000)
```
**优化**: 创建复合索引或优化WHERE条件

#### 4. 性能监控视图

查看慢查询：
[[select * from pg_stat_statements order by total_time desc limit 10;]]{{RUN}}

查看表统计信息：
[[select * from pg_stat_user_tables order by seq_scan desc limit 10;]]{{RUN}}

查看索引使用情况：
[[select * from pg_stat_user_indexes order by idx_scan desc limit 10;]]{{RUN}}

#### 规范CheckList**:
- [ ] 掌握EXPLAIN ANALYZE的使用
- [ ] 理解执行计划的指标含义
- [ ] 能够识别常见性能问题
- [ ] 掌握性能监控视图的使用

[验证结果]：自评你的答案是否覆盖关键点。
