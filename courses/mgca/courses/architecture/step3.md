# 查询处理与优化

## 查询处理流程

GaussDB 的查询处理包含以下阶段：

### 1. 解析阶段 (Parsing)
- **语法分析**: 将 SQL 文本转换为抽象语法树 (AST)
- **语义分析**: 检查表、列、函数是否存在
- **权限检查**: 验证用户是否有执行权限

### 2. 查询重写 (Query Rewriting)
- **视图展开**: 将视图定义替换为实际查询
- **规则应用**: 应用查询重写规则
- **常量折叠**: 简化常量表达式
- **谓词下推**: 将过滤条件下推到子查询

### 3. 优化阶段 (Optimization)
- **成本估算**: 评估不同执行计划的成本
- **连接顺序**: 选择最优的表连接顺序
- **访问方法**: 选择全表扫描或索引扫描
- **并行计划**: 生成并行执行计划

### 4. 执行阶段 (Execution)
- **执行器**: 按照执行计划操作数据
- **缓存管理**: 管理共享缓冲区中的数据页
- **结果返回**: 将结果返回给客户端

## 查询优化器

### 成本估算模型

优化器基于统计信息估算查询成本：

**I/O 成本**:
- 顺序扫描: pages * seq_page_cost
- 索引扫描: pages * random_page_cost
- 索引条目: tuples * cpu_tuple_cost

**CPU 成本**:
- 处理元组: tuples * cpu_tuple_cost
- 连接操作: rows * cpu_operator_cost

**并行成本**:
- 并行启动成本: parallel_setup_cost
- 并行执行成本: rows * parallel_tuple_cost

### 执行计划类型

**1. 顺序扫描 (Seq Scan)**
- 适用: 全表访问，无合适索引
- 成本: pages * seq_page_cost
- 优势: 单次扫描，适合大表全量查询

**2. 索引扫描 (Index Scan)**
- 适用: 有选择性高的索引
- 成本: pages * random_page_cost + rows * index_scan_cost
- 优势: 只扫描需要的数据页

**3. 位图扫描 (Bitmap Scan)**
- 适用: 多个索引组合查询
- 成本: 多个索引扫描的并集
- 优势: 避免重复扫描同一数据页

**4. 只索引扫描 (Index Only Scan)**
- 适用: 查询列都在索引中
- 成本: 最低（不访问数据页）
- 优势: 最大程度减少 I/O

## 执行计划分析

使用 EXPLAIN 命令查看执行计划：

```
EXPLAIN SELECT * FROM table_name WHERE column = value;
```

使用 EXPLAIN ANALYZE 获取实际执行统计：

```
EXPLAIN ANALYZE SELECT * FROM table_name WHERE column = value;
```

### 执行计划关键信息

- **估算行数 (rows)**: 优化器估算的结果行数
- **实际行数**: 实际执行时的结果行数
- **估算成本 (cost)**: 优化器估算的总成本
- **实际时间 (actual time)**: 实际执行时间（毫秒）
- **扫描类型**: Seq Scan, Index Scan, Bitmap Scan 等
- **连接方法**: Nested Loop, Hash Join, Merge Join

## 并行查询

GaussDB 支持并行查询以提高性能：

### 并行配置参数

- **max_parallel_workers_per_gather**: 每个节点最大并行工作进程数
- **max_parallel_workers**: 系统级最大并行工作进程数
- **parallel_setup_cost**: 并行启动成本
- **parallel_tuple_cost**: 并行执行成本

### 并行场景适用

- **大表扫描**: 顺序扫描大表时使用并行
- **大连接**: 连接操作可以并行执行
- **大聚合**: 聚合操作可以并行计算
- **排序和哈希**: 排序和哈希操作可以并行

## Tips

**生产环境建议**：
- 定期执行 ANALYZE 更新统计信息
- 为高频查询的列创建合适的索引
- 监控慢查询并优化执行计划
- 合理配置并行参数以提高性能
- 使用 EXPLAIN ANALYZE 分析性能问题

**性能优化**：
- **避免全表扫描**: 为 WHERE、JOIN、ORDER BY 列创建索引
- **避免 N+1 查询**: 使用 JOIN 替代循环查询
- **使用覆盖索引**: 将 SELECT 列都包含在索引中
- **优化连接顺序**: 确保连接顺序合理（小表驱动大表）

**企业规范 Checklist**：
- [ ] 所有生产 SQL 都经过 EXPLAIN 分析
- [ ] 定期执行 ANALYZE 更新统计信息
- [ ] 监控慢查询日志
- [ ] 合理配置并行参数
- [ ] 定期审查和优化索引

## 任务

创建测试表：

```
[[CREATE TABLE test_perf (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    category INT,
    value DECIMAL(10,2),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);]]{{RUN}}
```

插入测试数据：

`[[INSERT INTO test_perf (name, category, value) SELECT 'test-' || generate_series(1, 10000), (random() * 10)::INT, (random() * 1000)::DECIMAL(10,2);]]{{RUN}}`

创建索引：

`[[CREATE INDEX idx_test_perf_category ON test_perf(category);]]{{RUN}}`

`[[CREATE INDEX idx_test_perf_create_time ON test_perf(create_time);]]{{RUN}}`

查看简单查询的执行计划：

```
[[EXPLAIN SELECT * FROM test_perf WHERE category = 5;]]{{RUN}}
```

查看带分析的执行计划：

```
[[EXPLAIN ANALYZE SELECT * FROM test_perf WHERE category = 5;]]{{RUN}}
```

测试并行查询：

`[[SET max_parallel_workers_per_gather = 4;]]{{RUN}}`

```
[[EXPLAIN ANALYZE SELECT * FROM test_perf;]]{{RUN}}
```

比较不同查询的执行计划：

```
[[EXPLAIN ANALYZE SELECT * FROM test_perf WHERE category IN (1, 2, 3);]]{{RUN}}
```

```
[[EXPLAIN ANALYZE SELECT * FROM test_perf WHERE category = 1 OR category = 2 OR category = 3;]]{{RUN}}
```

**自动评分**：执行计划应该选择索引扫描而非全表扫描，并行查询应该显示并行工作进程。

## 错误演示

使用不合适的索引导致性能问题：

```
[[EXPLAIN SELECT * FROM test_perf WHERE name LIKE '%test%';]]{{RUN}}
```

说明：LIKE 后模糊查询无法使用普通索引，应该考虑全文索引或改变查询方式。
