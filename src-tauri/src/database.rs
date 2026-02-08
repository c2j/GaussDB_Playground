// Database module for openGauss/PostgreSQL
use anyhow::{Context, Result};
use deadpool_postgres::{Config, Runtime};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::Instant;

// Database configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: String,
}

impl DbConfig {
    // Convert to PostgreSQL connection string
    fn to_connection_string(&self) -> String {
        format!(
            "postgres://{}:{}@{}:{}/{}",
            self.username, self.password, self.host, self.port, self.database
        )
    }

    // Convert to deadpool Config
    fn to_deadpool_config(&self) -> Result<Config> {
        let mut cfg = Config::new();
        cfg.host = Some(self.host.clone());
        cfg.port = Some(self.port);
        cfg.user = Some(self.username.clone());
        cfg.password = Some(self.password.clone());
        cfg.dbname = Some(self.database.clone());
        Ok(cfg)
    }
}

// Query result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub execution_time: u64,
    pub affected_rows: Option<i64>,
}

// Schema information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableInfo {
    pub table_name: String,
    pub columns: Vec<ColumnInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnInfo {
    pub column_name: String,
    pub data_type: String,
    pub nullable: bool,
}

// Connection status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionStatus {
    pub connected: bool,
    pub message: Option<String>,
    pub version: Option<String>,
}

// Database manager
pub struct DatabaseManager {
    _config_path: PathBuf,
}

impl DatabaseManager {
    // Create new database manager
    pub fn new() -> Result<Self> {
        let config_dir = dirs::config_local_dir()
            .context("Failed to get config directory")?
            .join("openGaussPlayground");

        std::fs::create_dir_all(&config_dir)
            .context("Failed to create config directory")?;

        let config_path = config_dir.join("db_config.json");

        Ok(DatabaseManager {
            _config_path: config_path,
        })
    }

    // Test database connection
    pub async fn test_connection(&self, config: &DbConfig) -> Result<ConnectionStatus> {
        let start = Instant::now();

        let result = tokio_postgres::connect(&config.to_connection_string(), tokio_postgres::NoTls)
            .await;

        match result {
            Ok((client, connection)) => {
                // Spawn connection handler
                tokio::spawn(async move {
                    if let Err(e) = connection.await {
                        eprintln!("Connection error: {}", e);
                    }
                });

                // Get version
                let version = client
                    .query_one("SELECT version()", &[])
                    .await
                    .ok()
                    .and_then(|row| row.get(0));

                Ok(ConnectionStatus {
                    connected: true,
                    message: Some(format!("连接成功 ({}ms)", start.elapsed().as_millis())),
                    version,
                })
            }
            Err(e) => Ok(ConnectionStatus {
                connected: false,
                message: Some(format!("连接失败: {}", e)),
                version: None,
            }),
        }
    }

    // Execute SQL query
    pub async fn execute_query(&self, config: &DbConfig, sql: &str) -> Result<QueryResult> {
        let pool = config
            .to_deadpool_config()?
            .create_pool(Some(Runtime::Tokio1), tokio_postgres::NoTls)?;

        let client = pool.get().await?;

        let start = Instant::now();

        // Try execute first (for INSERT/UPDATE/DELETE)
        let execute_result = client.execute(sql, &[]).await;

        let (rows, affected_rows) = if execute_result.is_ok() {
            (vec![], Some(execute_result.unwrap() as i64))
        } else {
            // Try query (for SELECT)
            match client.query(sql, &[]).await {
                Ok(rows_vec) => (rows_vec, None),
                Err(e) => {
                    // If both fail, return original execute error
                    return Err(e.into());
                }
            }
        };

        let execution_time = start.elapsed().as_millis() as u64;

        // Get column names
        let columns = if !rows.is_empty() {
            rows[0]
                .columns()
                .iter()
                .map(|col| col.name().to_string())
                .collect()
        } else {
            vec![]
        };

        // Convert rows to string vectors
        let row_strings = rows
            .iter()
            .map(|row| {
                (0..row.len())
                    .map(|i| {
                        // Try to get value and convert to string
                        match row.try_get::<usize, &str>(i) {
                            Ok(s) => s.to_string(),
                            Err(_) => match row.try_get::<usize, i32>(i) {
                                Ok(n) => n.to_string(),
                                Err(_) => match row.try_get::<usize, i64>(i) {
                                    Ok(n) => n.to_string(),
                                    Err(_) => match row.try_get::<usize, f64>(i) {
                                        Ok(f) => f.to_string(),
                                        Err(_) => match row.try_get::<usize, bool>(i) {
                                            Ok(b) => b.to_string(),
                                            Err(_) => String::new(),
                                        }
                                    }
                                }
                            }
                        }
                    })
                    .collect()
            })
            .collect();

        Ok(QueryResult {
            columns,
            rows: row_strings,
            execution_time,
            affected_rows,
        })
    }

    // Get schema information
    pub async fn get_schema_info(&self, config: &DbConfig) -> Result<Vec<TableInfo>> {
        let pool = config
            .to_deadpool_config()?
            .create_pool(Some(Runtime::Tokio1), tokio_postgres::NoTls)?;

        let client = pool.get().await?;

        // Get all tables (excluding system schemas)
        let query = r#"
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
        "#;

        let rows = client.query(query, &[]).await?;

        // Group columns by table
        let mut tables: std::collections::HashMap<String, Vec<ColumnInfo>> =
            std::collections::HashMap::new();

        for row in rows {
            let table_name: String = row.get("table_name");
            let column_name: String = row.get("column_name");
            let data_type: String = row.get("data_type");
            let is_nullable: String = row.get("is_nullable");
            let nullable = is_nullable == "YES";

            tables
                .entry(table_name.clone())
                .or_insert_with(Vec::new)
                .push(ColumnInfo {
                    column_name,
                    data_type,
                    nullable,
                });
        }

        // Convert to TableInfo list
        let table_info = tables
            .into_iter()
            .map(|(table_name, columns)| TableInfo {
                table_name,
                columns,
            })
            .collect();

        Ok(table_info)
    }

    // Save configuration
    pub fn save_config(&self, config: &DbConfig) -> Result<()> {
        let config_dir = self._config_path.parent().unwrap();
        std::fs::create_dir_all(config_dir)?;

        let json = serde_json::to_string_pretty(config)?;
        std::fs::write(&self._config_path, json)?;

        Ok(())
    }

    // Load configuration
    pub fn load_config(&self) -> Result<Option<DbConfig>> {
        if !self._config_path.exists() {
            return Ok(None);
        }

        let json = std::fs::read_to_string(&self._config_path)?;
        let config = serde_json::from_str(&json)?;

        Ok(Some(config))
    }
}

impl Default for DatabaseManager {
    fn default() -> Self {
        Self::new().expect("Failed to create DatabaseManager")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
