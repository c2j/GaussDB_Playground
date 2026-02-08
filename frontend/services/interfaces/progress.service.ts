// 进度项
export interface ProgressItem {
  courseId: string;
  chapterId: string;
  stepId: string;
  completedAt?: string;
}

// 课程进度
export interface CourseProgress {
  courseId: string;
  totalSteps: number;
  completedSteps: number;
  completedStepIds: string[];
}

// 用户进度
export interface UserProgress {
  userId: string;
  courses: CourseProgress[];
}

export interface IProgressService {
  /**
   * 获取用户的所有学习进度
   */
  getProgress(userId: string): Promise<UserProgress>;

  /**
   * 获取特定课程的进度
   */
  getCourseProgress(userId: string, courseId: string): Promise<CourseProgress>;

  /**
   * 标记步骤为已完成
   */
  markStepComplete(
    userId: string,
    courseId: string,
    chapterId: string,
    stepId: string
  ): Promise<void>;

  /**
   * 重置课程进度
   */
  resetCourseProgress(userId: string, courseId: string): Promise<void>;

  /**
   * 获取下一个未完成的步骤
   */
  getNextIncompleteStep(
    userId: string,
    courseId: string
  ): Promise<{ chapterId: string; stepId: string } | null>;
}
