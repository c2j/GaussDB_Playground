import type {
  IDatabaseService,
  DbConfig,
  QueryResult,
  TableInfo,
  ConnectionStatus,
} from "../../interfaces/database.service";

export class MockDatabaseService implements IDatabaseService {
  private static config: DbConfig | null = null;

  async testConnection(config: DbConfig): Promise<ConnectionStatus> {
    console.log("[Mock] Testing database connection:", config);
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!config.host || !config.username || !config.password) {
      return {
        connected: false,
        message: "Missing required connection parameters",
      };
    }

    return {
      connected: true,
      message: "Connection successful",
      version: "openGauss 3.0.0",
    };
  }

  async executeQuery(_config: DbConfig, sql: string): Promise<QueryResult> {
    console.log("[Mock] Executing SQL:", sql);
    // Simulate query execution delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock different SQL commands
    const normalizedSql = sql.trim().toLowerCase();

    if (normalizedSql.startsWith("select")) {
      return {
        columns: ["id", "name", "value"],
        rows: [
          ["1", "item1", "100"],
          ["2", "item2", "200"],
          ["3", "item3", "300"],
        ],
        executionTime: 300,
        affectedRows: 3,
      };
    } else if (
      normalizedSql.startsWith("insert") ||
      normalizedSql.startsWith("update") ||
      normalizedSql.startsWith("delete")
    ) {
      return {
        columns: [],
        rows: [],
        executionTime: 250,
        affectedRows: 1,
      };
    }

    return {
      columns: [],
      rows: [],
      executionTime: 100,
    };
  }

  async getSchemaInfo(_config: DbConfig): Promise<TableInfo[]> {
    console.log("[Mock] Getting schema info");
    await new Promise((resolve) => setTimeout(resolve, 200));

    return [
      {
        tableName: "clients",
        columns: [
          { columnName: "id", dataType: "integer", nullable: false },
          { columnName: "name", dataType: "varchar(100)", nullable: false },
          { columnName: "email", dataType: "varchar(100)", nullable: true },
        ],
      },
      {
        tableName: "bank_cards",
        columns: [
          { columnName: "id", dataType: "integer", nullable: false },
          { columnName: "client_id", dataType: "integer", nullable: false },
          { columnName: "card_number", dataType: "varchar(20)", nullable: false },
        ],
      },
    ];
  }

  async saveConfig(config: DbConfig): Promise<void> {
    console.log("[Mock] Saving database config");
    MockDatabaseService.config = { ...config };
  }

  async loadConfig(): Promise<DbConfig | null> {
    console.log("[Mock] Loading database config");
    console.log("[Mock] Loading database config");
    return MockDatabaseService.config
      ? { ...MockDatabaseService.config }
      : null;
  }
}
