# DDL 操作

## CREATE TABLE

### 基本语法

```sql
CREATE TABLE table_name (
    column1 data_type [constraints],
    column2 data_type [constraints],
    ...
);
```

### 约束类型

**PRIMARY KEY**: 主键，唯一标识
```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100)
);
```

**NOT NULL**: 非空约束
```sql
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL
);
```

**UNIQUE**: 唯一约束
```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL
);
```

**CHECK**: 检查约束
```sql
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    price NUMERIC(10,2) CHECK (price > 0),
    stock INT CHECK (stock >= 0)
);
```

**DEFAULT**: 默认值
```sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);
```

## ALTER TABLE

### 添加列

```sql
ALTER TABLE products ADD COLUMN description TEXT;
```

### 修改列

```sql
ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(12,2);
```

### 删除列

```sql
ALTER TABLE products DROP COLUMN description;
```

### 添加约束

```sql
ALTER TABLE products ADD CONSTRAINT chk_price CHECK (price > 0);
```

### 删除约束

```sql
ALTER TABLE products DROP CONSTRAINT chk_price;
```

### 重命名列

```sql
ALTER TABLE products RENAME COLUMN name TO product_name;
```

### 重命名表

```sql
ALTER TABLE products RENAME TO inventory;
```

## DROP TABLE

```sql
DROP TABLE table_name;
```

如果表存在才删除：

```sql
DROP TABLE IF EXISTS table_name;
```

## 级联操作

### 外键约束

```sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    user_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

**ON DELETE 选项**:
- `CASCADE`: 删除父记录时级联删除子记录
- `SET NULL`: 删除父记录时将外键设为 NULL
- `SET DEFAULT`: 删除父记录时将外键设为默认值
- `RESTRICT`: 阻止删除（默认）
- `NO ACTION`: 与 RESTRICT 相同

**ON UPDATE 选项**:
- 与 ON DELETE 选项相同

## CREATE INDEX

### 基本索引

```sql
CREATE INDEX idx_users_email ON users(email);
```

### 复合索引

```sql
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);
```

### 唯一索引

```sql
CREATE UNIQUE INDEX idx_users_username ON users(username);
```

### 删除索引

```sql
DROP INDEX idx_users_email;
```

## CREATE VIEW

### 基本视图

```sql
CREATE VIEW user_orders AS
SELECT u.user_id, u.username, o.order_id, o.order_date, o.status
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id;
```

### 查看视图

```sql
SELECT * FROM user_orders;
```

### 删除视图

```sql
DROP VIEW user_orders;
```

## 序列 (SEQUENCE)

### 创建序列

```sql
CREATE SEQUENCE seq_users START 1 INCREMENT 1;
```

### 使用序列

```sql
CREATE TABLE users (
    user_id INT DEFAULT nextval('seq_users') PRIMARY KEY,
    username VARCHAR(50)
);
```

### 查看序列值

```sql
SELECT nextval('seq_users');  -- 获取下一个值
SELECT currval('seq_users');  -- 获取当前值
```

## Tips

**DDL 最佳实践**：
- 使用有意义且一致的命名规范
- 为列添加注释说明用途
- 合理设置约束保证数据完整性
- 创建必要的索引提高查询性能
- 使用视图简化复杂查询

**性能考虑**：
- 主键自动创建索引
- 外键列建议创建索引
- 避免在频繁更新的列上创建过多索引
- 复合索引的顺序很重要

**企业规范**：
- [ ] 使用统一的命名规范（小写+下划线）
- [ ] 添加列注释
- [ ] 设置合理的约束
- [ ] 为外键和查询条件列创建索引
- [ ] 使用视图简化复杂查询
- [ ] 定期审查索引使用情况

## 任务

创建用户表：

```
[[CREATE TABLE users (
    user_id INT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);]]{{RUN}}
```

创建商品表：

```
[[CREATE TABLE products (
    product_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    stock INT DEFAULT 0 CHECK (stock >= 0),
    category VARCHAR(50)
);]]{{RUN}}
```

创建订单表（带外键）：

```
[[CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);]]{{RUN}}
```

创建序列和订单详情表：

```
[[CREATE SEQUENCE seq_orders START 1;]]{{RUN}}

[[
CREATE TABLE order_details (
    detail_id INT PRIMARY KEY,
    order_id INT NOT NULL,
    subtotal NUMERIC(12,2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);]]{{RUN}}
```

创建订单汇总视图：

```
[[CREATE VIEW order_summary AS
SELECT
    o.order_id,
    u.username,
    p.name AS product_name,
    o.quantity,
    o.quantity * p.price AS total_price,
    o.status,
    o.order_date
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN products p ON o.product_id = p.product_id;
]]{{RUN}}
```

为查询频繁的字段创建索引：

`[[CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);]]{{RUN}}`

`[[CREATE INDEX idx_products_category ON products(category);]]{{RUN}}`

查询视图：

`[[SELECT * FROM order_summary;]]{{RUN}}`

## 错误演示

插入违反约束的数据：

```
[[INSERT INTO users (user_id, username, email) VALUES (1, NULL, 'test@test.com');]]{{PRINT}}
```

说明：username 设置了 NOT NULL 约束，不能插入 NULL。

插入违反外键约束的数据：

```
[[INSERT INTO orders (order_id, user_id, product_id) VALUES (1, 999, 1);]]{{PRINT}}
```

说明：user_id=999 在 users 表中不存在，违反外键约束。

删除被引用的父记录：

`[[DELETE FROM users WHERE user_id = 1;]]{{PRINT}}`

说明：如果 orders 表中引用了 user_id=1 的记录，会因外键约束失败。需要使用 CASCADE 级联删除。
