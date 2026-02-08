# Rust 后台实现文档

## 项目信息
- **项目路径**: `/Users/c2j/Projects/Desktop_Projects/DB/opengauss/GaussDB_Playground/`
- **Rust 版本**: 2021 edition
- **运行时**: Tokio (异步)
- **数据库驱动**: tokio-postgres + deadpool-postgres

---

## 已实现的后台功能

### ✅ 数据库连接模块 (`src-tauri/src/database.rs`)

**核心结构：**

```rust
// 数据库配置
pub struct DbConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: String,
}

// 查询结果
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub execution_time: u64,
    pub affected_rows: Option<i64>,
}

// Schema 信息
pub struct TableInfo {
    pub table_name: String,
    pub columns: Vec<ColumnInfo>,
}

// 连接状态
pub struct ConnectionStatus {
    pub connected: bool,
    pub message: Option<String>,
    pub version: Option<String>,
}

// 数据库管理器
pub struct DatabaseManager {
    _config_path: PathBuf,
}
```

**实现的功能：**

| 方法 | 描述 | 异步 |
|------|------|------|
| `new()` | 创建管理器，初始化配置目录 | - |
| `test_connection()` | 测试数据库连接，返回版本信息 | ✅ |
| `execute_query()` | 执行 SQL 查询，返回结果 | ✅ |
| `get_schema_info()` | 获取数据库表结构信息 | ✅ |
| `save_config()` | 保存配置到 JSON 文件 | - |
| `load_config()` | 从 JSON 文件加载配置 | - |

---

## Tauri 命令 (`src-tauri/src/lib.rs`)

### 1. `test_connection`
```rust
#[tauri::command]
async fn test_connection(config: DbConfig) -> Result<ConnectionStatus>
```

**功能：**
- 测试数据库连接
- 返回连接状态和数据库版本
- 计算连接耗时

**前端调用：**
```typescript
invoke("test_connection", { config })
```

---

### 2. `execute_query`
```rust
#[tauri::command]
async fn execute_query(config: DbConfig, sql: String) -> Result<QueryResult>
```

**功能：**
- 执行 SQL 查询
- 自动处理不同数据类型（bool, int, float, string）
- 计算执行时间
- 返回列名、行数据和影响行数

**前端调用：**
```typescript
invoke("execute_query", { config, sql })
```

---

### 3. `get_schema_info`
```rust
#[tauri::command]
async fn get_schema_info(config: DbConfig) -> Result<Vec<TableInfo>>
```

**功能：**
- 获取所有用户表（排除系统表）
- 返回表名和列信息（列名、数据类型、可空性）
- 按表名和列顺序排序

**SQL 查询：**
```sql
SELECT t.table_name, c.column_name, c.data_type, c.is_nullable
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_schema = c.table_schema
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY t.table_name, c.ordinal_position
```

**前端调用：**
```typescript
invoke("get_schema_info", { config })
```

---

### 4. `save_config`
```rust
#[tauri::command]
fn save_config(config: DbConfig) -> Result<()>
```

**功能：**
- 保存数据库配置到 JSON 文件
- 配置文件位置：`~/Library/Application Support/openGaussPlayground/db_config.json` (macOS)
- 自动创建配置目录

**前端调用：**
```typescript
invoke("save_config", { config })
```

---

### 5. `load_config`
```rust
#[tauri::command]
fn load_config() -> Result<Option<DbConfig>>
```

**功能：**
- 从配置文件加载保存的数据库配置
- 如果文件不存在，返回 `null`

**前端调用：**
```typescript
invoke("load_config")
```

---

## 依赖项 (`Cargo.toml`)

```toml
[dependencies]
# Tauri
tauri = { version = "1.8", features = ["shell-open"] }

# 序列化
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# 错误处理
anyhow = "1.0"
thiserror = "1.0"

# 数据库
tokio-postgres = "0.7"
tokio = { version = "1", features = ["full"] }
deadpool-postgres = "0.14"

# 配置
dirs = "5.0"
```

---

## 前端集成

### 1. Tauri 服务实现 (`frontend/services/impl/tauri/database.service.ts`)

```typescript
export class TauriDatabaseService implements IDatabaseService {
  async testConnection(config: DbConfig): Promise<ConnectionStatus> {
    return invoke("test_connection", { config });
  }

  async executeQuery(config: DbConfig, sql: string): Promise<QueryResult> {
    return invoke("execute_query", { config, sql });
  }

  async getSchemaInfo(config: DbConfig): Promise<TableInfo[]> {
    return invoke("get_schema_info", { config });
  }

  async saveConfig(config: DbConfig): Promise<void> {
    return invoke("save_config", { config });
  }

  async loadConfig(): Promise<DbConfig | null> {
    return invoke("load_config");
  }
}
```

### 2. 服务工厂 (`frontend/services/index.ts`)

```typescript
const isTauri = !!(window as any).__TAURI_IPC__;

export function createDatabaseService(): IDatabaseService {
  if (!databaseService) {
    databaseService = isTauri
      ? new TauriDatabaseService()
      : new MockDatabaseService();
  }
  return databaseService;
}
```

**自动检测环境：**
- 开发环境（浏览器）：使用 Mock 服务
- Tauri 环境（桌面应用）：使用真实数据库服务

---

## 文件结构

```
src-tauri/
├── src/
│   ├── main.rs              # 应用入口，注册 Tauri 命令
│   ├── lib.rs               # Tauri 命令定义
│   └── database.rs          # 数据库模块（新建）
├── Cargo.toml               # Rust 依赖配置（已更新）
└── build.rs                # 构建脚本

frontend/
├── services/
│   ├── impl/
│   │   └── tauri/
│   │       └── database.service.ts    # Tauri API 调用（已更新）
│   └── index.ts
```

---

## 数据类型映射

| PostgreSQL 类型 | Rust 类型 | 输出格式 |
|---------------|-----------|---------|
| bool | bool | "true"/"false" |
| int4, int8 | i64 | 字符串 |
| float4, float8 | f64 | 字符串 |
| text, varchar | String | 原始值 |
| timestamp | String | ISO 格式 |
| NULL | - | 空字符串 |

---

## 错误处理

### Rust 端
- 使用 `anyhow::Context` 添加错误上下文
- 使用 `thiserror` 自定义错误类型（预留）
- 所有命令返回 `Result<T>`，错误自动转换为 String

### 前端端
- Hook 层捕获错误并显示给用户
- 错误信息在 UI 中以红色卡片显示

---

## 性能优化

### 1. 连接池 (deadpool-postgres)
- 复用数据库连接
- 减少连接建立开销
- 支持并发查询

### 2. 异步执行 (Tokio)
- 非阻塞 I/O
- 支持并发请求
- 高性能查询处理

### 3. 懒加载配置
- 只在需要时加载配置
- 减少启动时间

---

## 安全考虑

### 1. 密码安全
- 密码保存在本地配置文件
- 配置文件位置：用户专用目录
- 未来考虑使用系统钥匙串

### 2. SQL 注入防护
- 使用参数化查询（`client.query(sql, &[])`）
- 不直接拼接 SQL 字符串
- 前端输入不信任（需要在实际部署时加强）

### 3. 连接限制
- 使用连接池限制最大连接数
- 防止资源耗尽

---

## 配置文件位置

| 平台 | 配置目录 |
|------|---------|
| macOS | `~/Library/Application Support/openGaussPlayground/` |
| Linux | `~/.config/openGaussPlayground/` |
| Windows | `%APPDATA%\openGaussPlayground\` |

**配置文件**: `db_config.json`

---

## 测试

### 单元测试 (`src-tauri/src/database.rs`)

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

## 编译状态

- ✅ TypeScript 前端：编译成功
- 🔄 Rust 后台：依赖编译中（首次编译需要较长时间）

**预计时间：** 5-10 分钟（取决于网络和机器性能）

---

## 下一步（可选）

### 1. 功能增强
- [ ] SSL/TLS 连接支持
- [ ] 连接超时配置
- [ ] 查询历史记录
- [ ] 批量查询执行
- [ ] 事务支持

### 2. 性能优化
- [ ] 虚拟滚动（大数据集）
- [ ] 查询结果缓存
- [ ] 预编译语句缓存

### 3. 安全增强
- [ ] 密码加密存储
- [ ] SQL 白名单
- [ ] 查询权限控制

### 4. 开发体验
- [ ] 日志系统
- [ ] 错误追踪
- [ ] 性能监控

---

## 使用示例

### 1. 启动开发服务器
```bash
npm run tauri:dev
```

### 2. 构建生产版本
```bash
npm run tauri:build
```

### 3. 只编译 Rust
```bash
cd src-tauri
cargo build --release
```

---

## 故障排除

### 问题：连接失败
1. 检查数据库是否运行
2. 验证主机、端口、用户名、密码
3. 检查防火墙设置
4. 查看 Tauri 日志

### 问题：依赖编译失败
```bash
# 清理缓存重新编译
cd src-tauri
cargo clean
cargo build
```

### 问题：配置文件未保存
1. 检查应用权限
2. 手动创建配置目录
3. 查看控制台错误信息
