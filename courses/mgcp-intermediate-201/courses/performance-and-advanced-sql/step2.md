### 慢查询分析与优化

本步骤通过实际案例演示如何分析和优化慢查询。

#### 案例：银行交易查询优化

**原始查询（慢）**:
```sql
SELECT t.account_id, t.amount, c.name
FROM transactions t
LEFT JOIN customers c ON t.account_id = c.account_id
WHERE t.transaction_date >= '2024-01-01'
  AND c.city = 'Beijing'
ORDER BY t.transaction_time DESC
LIMIT 1000;
```

执行计划分析：
[[explain analyze SELECT t.account_id, t.amount, c.name FROM transactions t LEFT JOIN customers c ON t.account_id = c.account_id WHERE t.transaction_date >= '2024-01-01' AND c.city = 'Beijing' ORDER BY t.transaction_time DESC LIMIT 1000;]]{{RUN}}

**性能瓶颈**:
- 顺序扫描transactions表
- 高估的行数
- 排序操作开销大

#### 优化策略

**优化1: 创建索引**
[[create index idx_trans_date on transactions(transaction_date);]]{{RUN}}
[[create index idx_trans_account_time on transactions(account_id, transaction_time DESC);]]{{RUN}}
[[create index idx_cust_city on customers(city);]]{{RUN}}

验证索引效果：
[[explain analyze SELECT t.account_id, t.amount, c.name FROM transactions t LEFT JOIN customers c ON t.account_id = c.account_id WHERE t.transaction_date >= '2024-01-01' AND c.city = 'Beijing' ORDER BY t.transaction_time DESC LIMIT 1000;]]{{RUN}}

**优化2: 重写查询（覆盖索引）**
[[SELECT t.account_id, t.amount, c.name FROM transactions t WHERE t.transaction_date >= '2024-01-01' AND EXISTS (SELECT 1 FROM customers c WHERE c.account_id = t.account_id AND c.city = 'Beijing') ORDER BY t.transaction_time DESC LIMIT 1000;]]{{RUN}}

**自动评分**: 执行时间 < 1s 为满分。

#### 3. 高级SQL技巧

**窗口函数**:
```sql
SELECT account_id, amount, 
       SUM(amount) OVER (PARTITION BY account_id ORDER BY transaction_time) as running_balance
FROM transactions;
```

**CTE（公共表表达式）**:
```sql
WITH daily_totals AS (
  SELECT transaction_date, SUM(amount) as total
  FROM transactions
  GROUP BY transaction_date
)
SELECT * FROM daily_totals WHERE total > 1000000;
```

**UNION ALL优化**:
[[SELECT account_id, amount, 'deposit' as type FROM deposits WHERE date >= '2024-01-01';]]{{RUN}}
[[UNION ALL]]{{RUN}}
[[SELECT account_id, amount, 'withdrawal' as type FROM withdrawals WHERE date >= '2024-01-01';]]{{RUN}}

#### 验证结果

查询优化后应该满足：
- 使用索引扫描而非顺序扫描
- 执行时间显著降低
- 返回结果一致

#### 规范CheckList**:
- [ ] 掌握慢查询分析流程
- [ ] 理解索引优化策略
- [ ] 掌握高级SQL技巧
- [ ] 能够编写高效的查询
- [ ] 了解窗口函数和CTE的应用

[验证结果]：自评你的答案是否覆盖关键点。
