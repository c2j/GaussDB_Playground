import { useCourses, useCourseDetail, useCourseProgress } from "../hooks";
import { useAppStore } from "../store/app.store";
import { useEffect, useState } from "react";

export function Sidebar() {
  const { data: courses, isLoading } = useCourses();
  const [isTauriReady, setIsTauriReady] = useState(false);

  useEffect(() => {
    // 延迟检测 Tauri 环境
    const checkTauri = setInterval(() => {
      const tauriReady = !!(window as any).__TAURI__;
      console.log("[Sidebar] Checking Tauri:", tauriReady, (window as any).__TAURI__);
      if (tauriReady) {
        setIsTauriReady(true);
        clearInterval(checkTauri);
      }
    }, 500);

    // 5秒后停止检测
    setTimeout(() => {
      clearInterval(checkTauri);
      console.log("[Sidebar] Tauri check timeout");
    }, 5000);

    return () => clearInterval(checkTauri);
  }, []);

  console.log("[Sidebar] Render - courses:", courses);
  console.log("[Sidebar] Render - isLoading:", isLoading);
  console.log("[Sidebar] Render - courses length:", courses?.length);
  console.log("[Sidebar] Render - isTauriReady:", isTauriReady);
  const {
    selectedCourseId,
    selectedChapterId,
    setSelectedCourse,
    setSelectedChapter,
    setSelectedStep,
  } = useAppStore();
  const userId = "mock_user";

  // Get course detail when a course is selected
  const { data: selectedCourseDetail } = useCourseDetail(
    selectedCourseId || ""
  );

  // Get course progress - always call the hook (React Hooks rule)
  const selectedCourseProgress = useCourseProgress(
    userId,
    selectedCourseId || ""
  );

  const handleCourseClick = (courseId: string) => {
    if (selectedCourseId === courseId) {
      setSelectedCourse(null);
      setSelectedChapter(null);
      setSelectedStep(null);
    } else {
      setSelectedCourse(courseId);
    }
  };

  const handleChapterClick = (_courseId: string, chapterDir: string) => {
    if (selectedChapterId === chapterDir) {
      setSelectedChapter(null);
      setSelectedStep(null);
    } else {
      setSelectedChapter(chapterDir);
      setSelectedStep("step1.md");
    }
  };

  if (isLoading) {
    return (
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>© 2026 openGauss Playground</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          openGauss 课程
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2" data-testid="course-list">
        {(courses || []).map((course: any) => (
          <div key={course.id}>
            <button
              onClick={() => handleCourseClick(course.id)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                selectedCourseId === course.id
                  ? "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-200 dark:border-primary-700"
                  : "hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-transparent"
              }`}
            >
              <div className="font-medium text-slate-900 dark:text-white text-sm">
                {course.title || `Course ${course.id}`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {course.description || `Description for course ${course.id}`}
              </div>

              {selectedCourseId === course.id &&
                selectedCourseProgress?.data && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>进度</span>
                      <span className="font-medium">
                        {selectedCourseProgress.data?.completedSteps}/
                        {selectedCourseProgress.data?.totalSteps}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((selectedCourseProgress.data?.completedSteps || 0) /
                              (selectedCourseProgress.data?.totalSteps || 1)
                          ) * 100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </button>

            {selectedCourseId === course.id && selectedCourseDetail && (
              <div className="ml-2 mt-2 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-3" data-testid="chapter-list">
                {selectedCourseDetail.chapters?.map((chapter: any) => (
                  <button
                    key={`${course.id}-${chapter.content_dir}`}
                    onClick={() => handleChapterClick(course.id, chapter.content_dir)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 text-sm ${
                      selectedChapterId === chapter.content_dir
                        ? "bg-primary-100 dark:bg-primary-800/50 font-medium"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          selectedChapterId === chapter.content_dir ? "rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="text-slate-700 dark:text-slate-300">
                        {chapter.title}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-6">
                      {chapter.estimated_time}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>© 2026 openGauss Playground</span>
        </div>
      </div>
    </div>
  );
}
