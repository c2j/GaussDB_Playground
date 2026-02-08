// 服务导出与工厂模式
import type {
  ICourseService,
  IProgressService,
  IDatabaseService,
} from "./interfaces";
import { MockCourseService } from "./impl/mock/course.service";
import { MockProgressService } from "./impl/mock/progress.service";
import { MockDatabaseService } from "./impl/mock/database.service";
import { TauriCourseService } from "./impl/tauri/course.service";
import { TauriProgressService } from "./impl/tauri/progress.service";
import { TauriDatabaseService } from "./impl/tauri/database.service";

// Detect Tauri environment (Tauri 1.x uses __TAURI__)
const isTauri = !!(window as any).__TAURI__;

console.log("[Service Factory] isTauri:", isTauri);
console.log("[Service Factory] window.__TAURI__ exists:", !!(window as any).__TAURI__);

// Service instances (singleton pattern)
let courseService: ICourseService | null = null;
let progressService: IProgressService | null = null;
let databaseService: IDatabaseService | null = null;

// Factory: Course Service
export function createCourseService(): ICourseService {
  if (!courseService) {
    console.log("[Service Factory] Creating course service, isTauri:", isTauri);
    courseService = isTauri
      ? new TauriCourseService()
      : new MockCourseService();
    console.log("[Service Factory] Course service created:", courseService.constructor.name);
  }
  return courseService;
}

// Factory: Progress Service
export function createProgressService(): IProgressService {
  if (!progressService) {
    progressService = isTauri
      ? new TauriProgressService()
      : new MockProgressService();
  }
  return progressService;
}

// Factory: Database Service
export function createDatabaseService(): IDatabaseService {
  if (!databaseService) {
    databaseService = isTauri
      ? new TauriDatabaseService()
      : new MockDatabaseService();
  }
  return databaseService;
}

// Check if running in Tauri environment
export const isTauriEnvironment = isTauri;
