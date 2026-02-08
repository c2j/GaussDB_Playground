// Tauri IPC Helper
import type {
  ICourseService,
  CourseInfo,
  CourseDetail,
  ChapterDetail,
  StepContent,
} from "../../interfaces/course.service";

// 使用 Tauri API npm 包
import { invoke } from '@tauri-apps/api/tauri';

console.log("[TauriCourseService] invoke function from @tauri-apps/api:", invoke);

export class TauriCourseService implements ICourseService {
  async getCourses(): Promise<CourseInfo[]> {
    console.log("[TauriCourseService] Calling get_courses...");
    try {
      const result = await invoke<CourseInfo[]>("get_courses");
      console.log("[TauriCourseService] get_courses result:", result);
      return result;
    } catch (error) {
      console.error("[TauriCourseService] get_courses error:", error);
      throw error;
    }
  }

  async getCourseDetail(courseId: string): Promise<CourseDetail> {
    console.log("[TauriCourseService] Calling get_course_detail for:", courseId);
    try {
      const result = await invoke<CourseDetail>("get_course_detail", { courseId });
      console.log("[TauriCourseService] get_course_detail result:", result);
      return result;
    } catch (error) {
      console.error("[TauriCourseService] get_course_detail error:", error);
      throw error;
    }
  }

  async getChapterDetail(
    courseId: string,
    chapterDir: string
  ): Promise<ChapterDetail> {
    console.log("[TauriCourseService] Calling get_chapter_detail for:", courseId, chapterDir);
    try {
      const result = await invoke<ChapterDetail>("get_chapter_detail", { courseId, chapterDir });
      console.log("[TauriCourseService] get_chapter_detail result:", result);
      return result;
    } catch (error) {
      console.error("[TauriCourseService] get_chapter_detail error:", error);
      throw error;
    }
  }

  async getStepContent(
    courseId: string,
    chapterDir: string,
    stepFile: string
  ): Promise<StepContent> {
    console.log("[TauriCourseService] Calling get_step_content for:", courseId, chapterDir, stepFile);
    try {
      const result = await invoke<StepContent>("get_step_content", { courseId, chapterDir, stepFile });
      console.log("[TauriCourseService] get_step_content result:", result);
      return result;
    } catch (error) {
      console.error("[TauriCourseService] get_step_content error:", error);
      throw error;
    }
  }
}
