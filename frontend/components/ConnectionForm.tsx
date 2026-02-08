// 数据库配置表单
import { DbConfig } from "../services/interfaces/database.service";

interface ConnectionFormProps {
  config: Partial<DbConfig>;
  onChange: (config: Partial<DbConfig>) => void;
  onTest: () => void;
  onSave: () => void;
  isTesting: boolean;
  isSaving: boolean;
  testResult?: { success: boolean; message?: string };
}

export function ConnectionForm({
  config,
  onChange,
  onTest,
  onSave,
  isTesting,
  isSaving,
  testResult,
}: ConnectionFormProps) {
  const handleInputChange = (field: keyof DbConfig, value: string | number) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4V7"
            />
          </svg>
          数据库连接配置
        </h3>

        {/* 连接状态指示器 */}
        {testResult && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
            testResult.success
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}>
            {testResult.success ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="font-medium">{testResult.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            主机
          </label>
          <input
            type="text"
            data-testid="db-host"
            value={config.host || ""}
            onChange={(e) => handleInputChange("host", e.target.value)}
            placeholder="127.0.0.1"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            端口
          </label>
          <input
            type="number"
            data-testid="db-port"
            value={config.port || 5432}
            onChange={(e) =>
              handleInputChange("port", parseInt(e.target.value))
            }
            placeholder="5432"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            用户名
          </label>
          <input
            type="text"
            data-testid="db-username"
            value={config.username || ""}
            onChange={(e) => handleInputChange("username", e.target.value)}
            placeholder="postgres"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            密码
          </label>
          <input
            type="password"
            data-testid="db-password"
            value={config.password || ""}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="••••••"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white transition-all"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            数据库
          </label>
          <input
            type="text"
            data-testid="db-database"
            value={config.database || ""}
            onChange={(e) => handleInputChange("database", e.target.value)}
            placeholder="postgres"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white transition-all"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onTest}
          disabled={isTesting}
          className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isTesting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>测试中...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>测试连接</span>
            </>
          )}
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>保存中...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m5 3V7a2 2 0 002-2h-3m0-8l3-3M6 7l3-3m-3 3v8"
                />
              </svg>
              <span>保存配置</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
