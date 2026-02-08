// 数据库配置
export interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

// 查询结果
export interface QueryResult {
  columns: string[];
  rows: string[][];
  executionTime: number; // ms
  affectedRows?: number;
}

// Schema 信息
export interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  nullable: boolean;
}

// 连接状态
export interface ConnectionStatus {
  connected: boolean;
  message?: string;
  version?: string;
}

export interface IDatabaseService {
  /**
   * 测试数据库连接
   */
  testConnection(config: DbConfig): Promise<ConnectionStatus>;

  /**
   * 执行 SQL 查询
   */
  executeQuery(config: DbConfig, sql: string): Promise<QueryResult>;

  /**
   * 获取数据库 schema 信息
   */
  getSchemaInfo(config: DbConfig): Promise<TableInfo[]>;

  /**
   * 保存数据库配置
   */
  saveConfig(config: DbConfig): Promise<void>;

  /**
   * 加载保存的数据库配置
   */
  loadConfig(): Promise<DbConfig | null>;
}
