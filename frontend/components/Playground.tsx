import { useState, useEffect } from "react";
import { ConnectionForm } from "./ConnectionForm";
import { QueryResultTable } from "./QueryResultTable";
import type { DbConfig, QueryResult, ConnectionStatus } from "../services/interfaces/database.service";
import { useTestConnection, useExecuteQuery, useSchemaInfo } from "../hooks";
import { useAppStore } from "../store/app.store";

 export function Playground() {
   const setDbConnected = useAppStore((state) => state.setDbConnected);
   const expandSqlPractice = useAppStore((state) => state.expandSqlPractice);
   const sqlPracticeAutoExpanded = useAppStore((state) => state.sqlPracticeAutoExpanded);

  const [config, setConfig] = useState<Partial<DbConfig>>({
    host: "localhost",
    port: 5432,
    database: "postgres",
    username: "",
    password: "",
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string }>();
  const [showEditor, setShowEditor] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Get schema info when connected
  const { data: schemaInfo } = useSchemaInfo(testResult?.success ? (config as DbConfig) : null);

  // Auto-show editor when connection is successful
  useEffect(() => {
    if (testResult?.success) {
      setShowEditor(true);
    }
  }, [testResult?.success]);

  const testConnection = useTestConnection();
  const executeQuery = useExecuteQuery();

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testConnection.mutateAsync(config as DbConfig) as ConnectionStatus;
      setTestResult({
        success: result.connected,
        message: result.message || (result.connected ? "连接成功" : "连接失败")
      });
      // Update global connection state
      setDbConnected(result.connected);
      
      // Auto-expand SQL practice area when connection succeeds
      if (result.connected && !sqlPracticeAutoExpanded) {
        expandSqlPractice();
      }
    } catch (error) {
      setTestResult({ success: false, message: "连接失败" });
      setDbConnected(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: 实现实际的保存逻辑
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteSql = async (sql: string) => {
    setQueryError(null);
    try {
      const result = await executeQuery.mutateAsync({
        config: config as DbConfig,
        sql
      });
      setQueryResult(result);
    } catch (error: any) {
      setQueryError(error.message || "查询执行失败");
      setQueryResult(null);
    }
  };

  const handleEditorExecute = async () => {
    if (sqlQuery.trim()) {
      await handleExecuteSql(sqlQuery);
    }
  };

  const handleClearSql = () => {
    setSqlQuery("");
    setQueryResult(null);
    setQueryError(null);
  };

  const handleInsertExample = (example: string) => {
    setSqlQuery(example);
  };

  const exampleQueries = [
    "-- 查看所有表\nSELECT * FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');",
    "-- 查询客户表\nSELECT * FROM clients LIMIT 10;",
    "-- 统计数据\nSELECT COUNT(*) as total FROM clients;"
  ];

  // Keyboard shortcut for executing SQL
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (showEditor && sqlQuery.trim()) {
          handleEditorExecute();
        }
      }
    };

    if (showEditor) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showEditor, sqlQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          openGauss 试验场
        </h1>

        {/* Connection Form */}
        <div className="max-w-4xl mb-8">
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            连接到 openGauss 数据库并执行 SQL 查询
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <ConnectionForm
              config={config}
              onChange={setConfig}
              onTest={handleTest}
              onSave={handleSave}
              isTesting={isTesting}
              isSaving={isSaving}
              testResult={testResult}
            />
          </div>

          {/* Show SQL Editor after connection */}
          {testResult?.success && (
            <div className="mt-6">
              {showEditor && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      SQL 编辑器
                    </h3>
                    <button
                      onClick={() => setShowEditor(false)}
                      className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="-- 输入 SQL 查询语句&#10;-- 示例: SELECT * FROM clients;&#10;-- 按 Ctrl+Enter 或 Cmd+Enter 执行"
                    className="w-full h-40 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    spellCheck={false}
                  />
                  <div className="mt-3 space-y-3">
                    {/* 快捷操作 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleClearSql}
                        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0117.138 21H7a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v12a2 2 0 01-2 2h-4l-2-2h-4z" />
                        </svg>
                        清空
                      </button>
                      <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">示例查询:</span>
                      <button
                        onClick={() => handleInsertExample(exampleQueries[0])}
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-3 py-1.5 rounded border border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                      >
                        查看表
                      </button>
                      <button
                        onClick={() => handleInsertExample(exampleQueries[1])}
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-3 py-1.5 rounded border border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                      >
                        查询数据
                      </button>
                      <button
                        onClick={() => handleInsertExample(exampleQueries[2])}
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-3 py-1.5 rounded border border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                      >
                        统计数据
                      </button>
                    </div>

                    {/* 执行按钮 */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        💡 提示: Ctrl+Enter 或 Cmd+Enter 快速执行
                      </div>
                      <button
                        onClick={handleEditorExecute}
                        disabled={!sqlQuery.trim() || executeQuery.isPending}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        {executeQuery.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            执行中...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            执行查询
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!showEditor && (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
                    数据库已连接，可以执行 SQL 查询
                  </p>
                  
                  {/* Database Info */}
                  {schemaInfo && schemaInfo.length > 0 && (
                    <div className="max-w-2xl mx-auto mb-6">
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4V7" />
                          </svg>
                          数据库概览
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">表数量:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{schemaInfo.length}</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            示例表名: {schemaInfo.slice(0, 3).map((t: any) => t.tableName).join(', ')}
                            {schemaInfo.length > 3 && `... 还有 ${schemaInfo.length - 3} 个表`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowEditor(true)}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors font-medium text-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1h-5l-5 5v5zM4 15a1 1 0 00-1 1v-1a1 1 0 011-1h1v3a1 1 0 001 1h3a1 1 0 001-1v-3h2V4h-4v3z" />
                    </svg>
                    打开 SQL 编辑器
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Query Results */}
          {queryResult && <QueryResultTable result={queryResult} className="mt-6" />}

          {/* Query Error */}
          {queryError && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.215V6.741c0-1.552-1.963-2.215-3.464-2.215H8.964c-1.54 0-3.502.667-3.502 2.215v6.056c0 1.548 1.963 2.215 3.464 2.215zm-1.457 6h-1.457c-.399 0-.756-.24-.884-.6L4.22 13.422c-.166-.246-.233-.526-.185-.816l.057-1.968c.097-.448.432-.726.868-.726h4.394c.436 0 .771.278.868.726l.057 1.968c.048.29.019.57-.185.816l-1.437.764c-.128.36-.485.6-.884.6z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                    查询执行失败
                  </h4>
                  <pre className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                    {queryError}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
