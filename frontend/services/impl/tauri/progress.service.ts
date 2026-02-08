// Tauri IPC Helper
import type {
  IProgressService,
  UserProgress,
  CourseProgress,
} from "../../interfaces/progress.service";

// 使用 Tauri API npm 包
import { invoke } from '@tauri-apps/api/tauri';

export class TauriProgressService implements IProgressService {
  async getProgress(userId: string): Promise<UserProgress> {
    return invoke<UserProgress>("get_progress", { userId });
  }

  async getCourseProgress(
    userId: string,
    courseId: string
  ): Promise<CourseProgress> {
    return invoke<CourseProgress>("get_course_progress", { userId, courseId });
  }

  async markStepComplete(
    userId: string,
    courseId: string,
    chapterId: string,
    stepId: string
  ): Promise<void> {
    return invoke<void>("update_step_progress", {
      userId,
      courseId,
      chapterId,
      stepId,
    });
  }

  async resetCourseProgress(userId: string, courseId: string): Promise<void> {
    return invoke<void>("reset_course_progress", { userId, courseId });
  }

  async getNextIncompleteStep(
    userId: string,
    courseId: string
  ): Promise<{ chapterId: string; stepId: string } | null> {
    return invoke<{ chapterId: string; stepId: string } | null>("get_next_incomplete_step", { userId, courseId });
  }
}
