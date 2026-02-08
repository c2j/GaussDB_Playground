// Tauri commands for openGauss Playground
mod database;
mod courses;

use database::{DbConfig, ConnectionStatus, QueryResult, TableInfo, DatabaseManager};

pub type Result<T> = std::result::Result<T, String>;
