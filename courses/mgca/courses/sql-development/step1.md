# SQL 基础和数据类型

## SQL 简介

SQL (Structured Query Language) 是用于管理关系型数据库的标准语言。GaussDB 支持标准的 SQL-2003 语法。

### SQL 分类

- **DDL (Data Definition Language)**: 定义数据库对象（CREATE, ALTER, DROP）
- **DML (Data Manipulation Language)**: 操作数据（INSERT, UPDATE, DELETE）
- **DQL (Data Query Language)**: 查询数据（SELECT）
- **DCL (Data Control Language)**: 控制访问权限（GRANT, REVOKE）
- **TCL (Transaction Control Language)**: 控制事务（COMMIT, ROLLBACK）

## 数据类型

### 数值类型

**整数类型**
- `SMALLINT`: 2字节, -32768 到 32767
- `INT` / `INTEGER`: 4字节, -2147483648 到 2147483647
- `BIGINT`: 8字节, -9223372036854775808 到 9223372036854775807

**浮点类型**
- `REAL`: 单精度浮点数
- `DOUBLE PRECISION`: 双精度浮点数
- `NUMERIC(m,n)`: 精确数值，指定总位数和小数位数

**示例**:

```sql
CREATE TABLE numeric_types (
    id INT PRIMARY KEY,
    small_val SMALLINT,
    int_val INT,
    big_val BIGINT,
    float_val REAL,
    double_val DOUBLE PRECISION,
    precise_val NUMERIC(10,2)
);
```

### 字符串类型

**定长字符串**
- `CHAR(n)`: 固定长度, 不足补空格
- `CHARACTER(n)`: CHAR 的别名

**变长字符串**
- `VARCHAR(n)`: 可变长度, 最多 n 个字符
- `CHARACTER VARYING(n)`: VARCHAR 的别名

**文本类型**
- `TEXT`: 无长度限制的文本

**示例**:

```sql
CREATE TABLE string_types (
    id INT PRIMARY KEY,
    code CHAR(10),
    name VARCHAR(100),
    description TEXT
);
```

### 日期时间类型

**日期类型**
- `DATE`: 日期（年-月-日）
- `TIME`: 时间（时:分:秒）
- `TIMESTAMP`: 日期和时间（带时区）
- `TIMESTAMPTZ`: 日期和时间（带时区）

**示例**:

```sql
CREATE TABLE datetime_types (
    id INT PRIMARY KEY,
    birth_date DATE,
    event_time TIME,
    created_at TIMESTAMP,
    updated_at TIMESTAMPTZ
);
```

### 布尔类型

- `BOOLEAN`: 布尔值（TRUE, FALSE, NULL）

### 二进制类型

- `BYTEA`: 二进制数据（可变长度）

## 常量和运算符

### 常量

**字符串常量**: 使用单引号
```sql
SELECT 'Hello World';
```

**数值常量**: 直接写数字
```sql
SELECT 123, 45.67;
```

**日期常量**: 使用单引号
```sql
SELECT DATE '2024-01-01';
SELECT TIMESTAMP '2024-01-01 12:00:00';
```

**NULL**: 表示缺失值

### 运算符

**算术运算符**: `+`, `-`, `*`, `/`, `%`
```sql
SELECT 10 + 5, 20 * 3, 15 / 3;
```

**比较运算符**: `=`, `<>`, `!=`, `<`, `>`, `<=`, `>=`
```sql
SELECT * FROM products WHERE price > 100;
```

**逻辑运算符**: `AND`, `OR`, `NOT`
```sql
SELECT * FROM products WHERE price > 100 AND stock > 0;
```

**字符串运算符**: `||` (连接)
```sql
SELECT first_name || ' ' || last_name AS full_name;
```

## 注释

**单行注释**: `--`
```sql
-- 这是一个单行注释
SELECT * FROM users;
```

**多行注释**: `/* */`
```sql
/*
这是一个
多行注释
*/
SELECT * FROM users;
```

## 类型转换

**隐式转换**: GaussDB 自动转换类型
```sql
SELECT '123' + 456;  -- 自动转换为数值
```

**显式转换**: 使用 CAST 或 `::` 运算符
```sql
SELECT CAST('2024-01-01' AS DATE);
SELECT '2024-01-01'::DATE;
```

## Tips

**数据类型选择**：
- 数值: 根据范围选择合适的整数类型
- 金额: 使用 NUMERIC 避免精度损失
- 字符串: VARCHAR 用于可变长度, TEXT 用于长文本
- 日期: TIMESTAMP 包含时间, DATE 只包含日期
- 布尔: 严格使用 BOOLEAN 而非 INT

**性能考虑**：
- 使用最小够用的类型减少存储
- 固定长度 CHAR 适合频繁比较的代码
- NUMERIC 比 FLOAT 精确但计算较慢

**企业规范**：
- [ ] 使用最合适的数据类型
- [ ] 设置合理的字段长度限制
- [ ] 添加必要的字段注释
- [ ] 考虑字段的可扩展性
- [ ] 统一命名规范

## 任务

创建测试表：

```
[[CREATE TABLE test_types (
    id INT PRIMARY KEY,
    int_val INT,
    varchar_val VARCHAR(50),
    date_val DATE,
    timestamp_val TIMESTAMP,
    bool_val BOOLEAN
);]]{{RUN}}
```

插入测试数据：

```
[[INSERT INTO test_types VALUES (
    1, 100, 'test', '2024-01-01', '2024-01-01 12:00:00', TRUE
);]]{{RUN}}
```

查询数据：

`[[SELECT * FROM test_types;]]{{RUN}}`

测试运算符：

`[[SELECT 10 + 20, 30 * 2, 50 / 5;]]{{RUN}}`

测试类型转换：

`[[SELECT '2024-01-01'::DATE;]]{{RUN}}`

`[[SELECT CAST('123' AS INT) + 456;]]{{RUN}}`

测试 NULL：

`[[SELECT NULL + 100;]]{{RUN}}`

说明：任何与 NULL 的运算结果都是 NULL。

## 错误演示

插入不匹配的数据类型：

```
[[INSERT INTO test_types (id, int_val) VALUES (2, 'not a number');]]{{PRINT}}
```

说明：会产生类型不匹配错误。必须使用正确的数据类型或显式转换。
