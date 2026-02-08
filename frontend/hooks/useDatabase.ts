// 数据库相关 Hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createDatabaseService } from "../services";
import type { DbConfig } from "../services/interfaces/database.service";

const databaseService = createDatabaseService();

// 测试连接
export function useTestConnection() {
  return useMutation({
    mutationFn: (config: DbConfig) =>
      databaseService.testConnection(config),
  });
}

// 执行查询
export function useExecuteQuery() {
  return useMutation({
    mutationFn: async (params: { config: DbConfig; sql: string }) => {
      return databaseService.executeQuery(params.config, params.sql);
    },
  });
}

// 获取 Schema 信息
export function useSchemaInfo(config: DbConfig | null) {
  return useQuery({
    queryKey: ["schema", config],
    queryFn: () => databaseService.getSchemaInfo(config!),
    enabled: !!config,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// 保存配置
export function useSaveDbConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: DbConfig) =>
      databaseService.saveConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dbConfig"] });
    },
  });
}

// 加载配置
export function useLoadDbConfig() {
  return useQuery({
    queryKey: ["dbConfig"],
    queryFn: () => databaseService.loadConfig(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
