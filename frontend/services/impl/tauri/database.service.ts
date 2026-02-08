// Tauri IPC Helper
import type {
  IDatabaseService,
  DbConfig,
  QueryResult,
  TableInfo,
  ConnectionStatus,
} from "../../interfaces/database.service";

// 使用 Tauri API npm 包
import { invoke } from '@tauri-apps/api/tauri';

export class TauriDatabaseService implements IDatabaseService {
  async testConnection(config: DbConfig): Promise<ConnectionStatus> {
    return invoke<ConnectionStatus>("test_connection", { config });
  }

  async executeQuery(config: DbConfig, sql: string): Promise<QueryResult> {
    return invoke<QueryResult>("execute_query", { config, sql });
  }

  async getSchemaInfo(config: DbConfig): Promise<TableInfo[]> {
    return invoke<TableInfo[]>("get_schema_info", { config });
  }

  async saveConfig(config: DbConfig): Promise<void> {
    return invoke<void>("save_config", { config });
  }

  async loadConfig(): Promise<DbConfig | null> {
    return invoke<DbConfig | null>("load_config");
  }
}
