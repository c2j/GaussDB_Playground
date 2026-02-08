// Zustand store for UI state management
import { create } from "zustand";

export interface AppState {
  // 当前选择的课程
  selectedCourseId: string | null;
  selectedChapterId: string | null;
  selectedStepId: string | null;

  // 当前标签页
  currentTab: "learn" | "playground";

  // 侧边栏展开状态
  sidebarCollapsed: boolean;

  // 数据库连接状态
  dbConnected: boolean;

  // Actions
  setSelectedCourse: (courseId: string | null) => void;
  setSelectedChapter: (chapterId: string | null) => void;
  setSelectedStep: (stepId: string | null) => void;
  setCurrentTab: (tab: "learn" | "playground") => void;
  toggleSidebar: () => void;
  resetSelection: () => void;
  setDbConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedCourseId: null,
  selectedChapterId: null,
  selectedStepId: null,
  currentTab: "learn",
  sidebarCollapsed: false,
  dbConnected: false,

  // Actions
  setSelectedCourse: (courseId) => set({ selectedCourseId: courseId }),
  setSelectedChapter: (chapterId) => set({ selectedChapterId: chapterId }),
  setSelectedStep: (stepId) => set({ selectedStepId: stepId }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setDbConnected: (connected) => set({ dbConnected: connected }),
  resetSelection: () =>
    set({
      selectedCourseId: null,
      selectedChapterId: null,
      selectedStepId: null,
    }),
}));
