// 课程信息
export interface CourseInfo {
  id: string;
  contentDir: string;
  title?: string;
  description?: string;
  logo?: string;
  poster?: string;
  cover?: string;
  status: string[];
}

// 章节信息
export interface ChapterInfo {
  content_dir: string;
  title: string;
  description: string;
  estimated_time: string;
}

// 步骤信息
export interface StepInfo {
  title: string;
  md_file: string;
}

// 课程详情
export interface CourseDetail {
  title: string;
  description: string;
  logo: string;
  poster: string;
  cover: string;
  containerLiveTime: string;
  chapters: ChapterInfo[];
}

// 章节详情
export interface ChapterDetail {
  title: string;
  description: string;
  steps: StepInfo[];
  estimatedTime: string;
  introduction?: string;
  finish?: string;
  backend: {
    imageId: string;
  };
}

// 步骤内容
export interface StepContent {
  title: string;
  content: string;
  sqlCommands?: SqlCommand[];
}

// SQL 命令
export interface SqlCommand {
  sql: string;
  description?: string;
}

export interface ICourseService {
  /**
   * 获取所有课程列表
   */
  getCourses(): Promise<CourseInfo[]>;

  /**
   * 获取课程详细信息
   */
  getCourseDetail(courseId: string): Promise<CourseDetail>;

  /**
   * 获取章节详情
   */
  getChapterDetail(
    courseId: string,
    chapterDir: string
  ): Promise<ChapterDetail>;

  /**
   * 获取步骤内容
   */
  getStepContent(
    courseId: string,
    chapterDir: string,
    stepFile: string
  ): Promise<StepContent>;
}
