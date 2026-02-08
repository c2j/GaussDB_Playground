import type {
  IProgressService,
  UserProgress,
  CourseProgress,
} from "../../interfaces/progress.service";

export class MockProgressService implements IProgressService {
  private static storage: UserProgress = {
    userId: "mock_user",
    courses: [],
  };

  async getProgress(_userId: string): Promise<UserProgress> {
    console.log(`[Mock] Getting progress for user: ${_userId}`);
    return MockProgressService.storage;
  }

  async getCourseProgress(
    _userId: string,
    courseId: string
  ): Promise<CourseProgress> {
    console.log(`[Mock] Getting course progress: ${courseId}`);
    const courseProgress =
      MockProgressService.storage.courses.find((c) => c.courseId === courseId) ||
      this.createEmptyCourseProgress(courseId);
    return courseProgress;
  }

  async markStepComplete(
    _userId: string,
    courseId: string,
    chapterId: string,
    stepId: string
  ): Promise<void> {
    console.log(
      `[Mock] Marking step complete: ${courseId}/${chapterId}/${stepId}`
    );
    let courseProgress = MockProgressService.storage.courses.find(
      (c) => c.courseId === courseId
    );

    if (!courseProgress) {
      courseProgress = this.createEmptyCourseProgress(courseId);
      MockProgressService.storage.courses.push(courseProgress);
    }

    if (!courseProgress.completedStepIds.includes(stepId)) {
      courseProgress.completedStepIds.push(stepId);
      courseProgress.completedSteps = courseProgress.completedStepIds.length;
    }
  }

  async resetCourseProgress(_userId: string, courseId: string): Promise<void> {
    console.log(`[Mock] Resetting course progress: ${courseId}`);
    const index = MockProgressService.storage.courses.findIndex(
      (c) => c.courseId === courseId
    );
    if (index >= 0) {
      MockProgressService.storage.courses.splice(index, 1);
    }
  }

  async getNextIncompleteStep(
    _userId: string,
    courseId: string
  ): Promise<{ chapterId: string; stepId: string } | null> {
    console.log(`[Mock] Getting next incomplete step: ${courseId}`);
    // Mock implementation - return null to indicate no incomplete steps
    return null;
  }

  private createEmptyCourseProgress(courseId: string): CourseProgress {
    return {
      courseId,
      totalSteps: 0,
      completedSteps: 0,
      completedStepIds: [],
    };
  }
}
