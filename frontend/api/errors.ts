// 统一的错误类型定义
export enum ErrorCode {
  // 通用错误
  UNKNOWN = "UNKNOWN",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // 课程相关错误
  COURSE_NOT_FOUND = "COURSE_NOT_FOUND",
  CHAPTER_NOT_FOUND = "CHAPTER_NOT_FOUND",
  STEP_NOT_FOUND = "STEP_NOT_FOUND",

  // 数据库连接错误
  CONNECTION_FAILED = "CONNECTION_FAILED",
  AUTH_FAILED = "AUTH_FAILED",
  SQL_ERROR = "SQL_ERROR",

  // 进度管理错误
  PROGRESS_SAVE_FAILED = "PROGRESS_SAVE_FAILED",
  PROGRESS_LOAD_FAILED = "PROGRESS_LOAD_FAILED",
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
}

export class AppException extends Error implements AppError {
  code: ErrorCode;
  details?: string;

  constructor(code: ErrorCode, message: string, details?: string) {
    super(message);
    this.name = "AppException";
    this.code = code;
    this.details = details;
  }
}

// 创建错误实例的辅助函数
export const createError = (
  code: ErrorCode,
  message: string,
  details?: string
): AppError => ({
  code,
  message,
  details,
});

// 判断是否为 AppError
export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
};
