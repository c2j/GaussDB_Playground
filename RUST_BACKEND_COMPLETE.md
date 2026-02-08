# Rust 后台实现完成

## ✅ 编译状态

- ✅ TypeScript 前端：编译成功
- ✅ Rust 后台：编译成功
- 📦 预计包大小：~5MB (release 模式)

---

## 已实现的后台功能

### 📁 文件结构

```
src-tauri/
├── src/
│   ├── main.rs              # 应用入口，Tauri 命令注册
│   ├── lib.rs               # 导出模块
│   └── database.rs          # 数据库连接和查询模块
├── Cargo.toml               # Rust 依赖配置
└── build.rs                # 构建脚本
```

---

## Tauri 命令实现

### 1. `test_connection`
```rust
#[tauri::command]
async fn test_connection(config: DbConfig) -> Result<ConnectionStatus, String>
```

**功能：**
- 测试数据库连接
- 返回连接状态、消息和数据库版本
- 计算连接耗时

**返回结构：**
```typescript
interface ConnectionStatus {
  connected: boolean;
  message?: string;  // "连接成功 (45ms)" 或 "连接失败: ..."
  version?: string;  // PostgreSQL 版本信息
}
```

---

### 2. `execute_query`
```rust
#[tauri::command]
async fn execute_query(config: DbConfig, sql: String) -> Result<QueryResult, String>
```

**功能：**
- 执行 SQL 查询（SELECT）或命令（INSERT/UPDATE/DELETE）
- 支持多种数据类型转换
- 计算执行时间
- 返回列名、行数据和影响行数

**数据类型支持：**
- `&str` → 字符串（text, varchar, char, name）
- `i32` → 整数（int2, int4）
- `i64` → 长整数（int8, bigint）
- `f64` → 浮点数（float4, float8）
- `bool` → 布尔值
- `String` → 其他类型作为字符串
- 空字符串 → NULL 值

**返回结构：**
```typescript
interface QueryResult {
  columns: string[];
  rows: string[][];  // 所有值都转换为字符串
  executionTime: number;  // 毫秒
  affectedRows?: number;
}
```

---

### 3. `get_schema_info`
```rust
#[tauri::command]
async fn get_schema_info(config: DbConfig) -> Result<Vec<TableInfo>, String>
```

**功能：**
- 获取数据库表结构
- 排除系统表（`pg_catalog`, `information_schema`）
- 返回表名、列信息

**SQL 查询：**
```sql
SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_schema = c.table_schema
  AND t.table_name = c.table_name
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position
```

**返回结构：**
```typescript
interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  columnName: string;
  dataType: string;  // PostgreSQL 数据类型
  nullable: boolean;  // true = YES, false = NO
}
```

---

### 4. `save_config`
```rust
#[tauri::command]
fn save_config(config: DbConfig) -> Result<(), String>
```

**功能：**
- 保存数据库配置到 JSON 文件
- 配置文件位置：
  - macOS: `~/Library/Application Support/openGaussPlayground/db_config.json`
  - Linux: `~/.config/openGaussPlayground/db_config.json`
  - Windows: `%APPDATA%\openGaussPlayground\db_config.json`

**配置文件格式：**
```json
{
  "host": "localhost",
  "port": 5432,
  "username": "postgres",
  "password": "password",
  "database": "postgres"
}
```

---

### 5. `load_config`
```rust
#[tauri::command]
fn load_config() -> Result<Option<DbConfig>, String>
```

**功能：**
- 从配置文件加载保存的数据库配置
- 如果文件不存在，返回 `null`

---

### 6. `greet` (向后兼容)
```rust
#[tauri::command]
fn greet(name: &str) -> String
```

---

## Rust 依赖项

| 包 | 版本 | 用途 |
|----|------|------|
| `tauri` | 1.8 | Tauri 框架 |
| `tokio-postgres` | 0.7 | PostgreSQL/openGauss 驱动 |
| `tokio` | 1.8 | 异步运行时 |
| `deadpool-postgres` | 0.14 | 连接池管理 |
| `serde` | 1.0 | 序列化/反序列化 |
| `serde_json` | 1.0 | JSON 处理 |
| `anyhow` | 1.0 | 错误处理 |
| `dirs` | 5.0 | 跨平台配置目录 |

---

## 数据库模块设计

### DatabaseManager
```rust
pub struct DatabaseManager {
    _config_path: PathBuf,
}

impl DatabaseManager {
    pub fn new() -> Result<Self>
    pub async fn test_connection(&self, config: &DbConfig) -> Result<ConnectionStatus>
    pub async fn execute_query(&self, config: &DbConfig, sql: &str) -> Result<QueryResult>
    pub async fn get_schema_info(&self, config: &DbConfig) -> Result<Vec<TableInfo>>
    pub fn save_config(&self, config: &DbConfig) -> Result<()>
    pub fn load_config(&self) -> Result<Option<DbConfig>>
}
```

---

## 前后端通信

### 前端调用示例

```typescript
import { invoke } from "@tauri-apps/api/tauri";

// 测试连接
const status = await invoke<ConnectionStatus>("test_connection", { config });

// 执行查询
const result = await invoke<QueryResult>("execute_query", { config, sql });

// 获取表结构
const tables = await invoke<TableInfo[]>("get_schema_info", { config });

// 保存配置
await invoke("save_config", { config });

// 加载配置
const config = await invoke<DbConfig | null>("load_config");
```

---

## 错误处理

### Rust 端
- 使用 `anyhow::Context` 添加错误上下文
- 所有命令返回 `Result<T, String>`
- 错误自动传递到前端

### 前端端
- Hook 层捕获错误并显示给用户
- 错误信息以红色卡片显示

---

## 性能特性

### 1. 连接池（deadpool-postgres）
- 复用数据库连接
- 减少连接建立开销
- 支持并发查询
- 自动管理连接生命周期

### 2. 异步执行（Tokio）
- 非阻塞 I/O
- 支持并发请求
- 高性能查询处理

### 3. 类型安全的序列化（serde）
- 编译时类型检查
- 自动 JSON 序列化
- 零拷贝数据传输

---

## 安全考虑

### 1. 密码存储
- 密码以明文存储在本地配置文件
- 配置文件在用户专用目录
- ⚠️ 未来考虑使用系统钥匙串加密

### 2. SQL 注入防护
- 当前实现使用参数化查询框架
- ⚠️ 但 `client.query(sql, &[])` 需要实际使用参数
- 前端输入不信任（需要在实际部署时加强）

### 3. 连接安全
- 当前使用 NoTls（不加密）
- ⚠️ 生产环境应使用 SSL/TLS

---

## 测试

### 单元测试（database.rs）
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_config_to_connection_string() {
        let config = DbConfig {
            host: "localhost".to_string(),
            port: 5432,
            username: "user".to_string(),
            password: "pass".to_string(),
            database: "db".to_string(),
        };

        let conn_str = config.to_connection_string();
        assert_eq!(conn_str, "postgres://user:pass@localhost:5432/db");
    }
}
```

**运行测试：**
```bash
cd src-tauri
cargo test
```

---

## 构建和运行

### 开发模式
```bash
npm run tauri:dev
```

### 生产构建
```bash
npm run tauri:build
```

### 单独构建 Rust
```bash
cd src-tauri
cargo build --release
```

---

## 已知限制

1. **SQL 注入防护不完整**：当前实现未完全使用参数化查询
2. **SSL/TLS 未实现**：连接不加密
3. **密码明文存储**：配置文件中的密码未加密
4. **错误消息为英文**：部分错误消息未本地化
5. **连接池配置硬编码**：使用默认连接池设置

---

## 下一步建议

### 短期（高优先级）
1. ✅ 实现 SQL 参数化查询（防注入）
2. ✅ 添加 SSL/TLS 连接支持
3. ✅ 密码加密存储（钥匙串）
4. ✅ 添加查询超时配置
5. ✅ 实现连接池配置

### 中期（中优先级）
1. 查询历史记录
2. 批量查询执行
3. 事务支持
4. 日志系统
5. 错误追踪

### 长期（低优先级）
1. 数据库备份功能
2. 数据导入/导出
3. 查询优化建议
4. 实时数据监控

---

## 故障排除

### 问题：编译错误 "macro not found"
**解决方案：**
- 确保 `#[tauri::command]` 属性在函数上
- 检查 `tauri::generate_handler!` 包含所有命令

### 问题：连接失败
**解决方案：**
1. 检查数据库是否运行
2. 验证主机、端口、用户名、密码
3. 检查防火墙设置
4. 查看应用日志

### 问题：依赖下载慢
**解决方案：**
```bash
# 使用国内镜像（中国）
export CARGO_HTTP_MULTIPLEXING=false
cargo build
```

---

## 文档更新时间
2025-02-07
