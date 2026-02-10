// Zustand store for UI state management
import { create } from "zustand";

export interface AppState {
  // 当前选择的课程
  selectedCourseId: string | null;
  selectedChapterId: string | null;
  selectedStepId: string | null;

  // 当前选择的专业
  selectedMajorId: string | null;

  // 当前标签页
  currentTab: "learn" | "playground";

  // 侧边栏展开状态
  sidebarCollapsed: boolean;

  // SQL实践区域折叠状态
  sqlPracticeCollapsed: boolean;
  
  // 数据库连接状态
  dbConnected: boolean;
  
  // 是否已自动展开过 SQL 实践区域（用于避免重复自动展开）
  sqlPracticeAutoExpanded: boolean;

  // Actions
  setSelectedCourse: (courseId: string | null) => void;
  setSelectedChapter: (chapterId: string | null) => void;
  setSelectedStep: (stepId: string | null) => void;
  setSelectedMajor: (majorId: string | null) => void;
  setCurrentTab: (tab: "learn" | "playground") => void;
  toggleSidebar: () => void;
  toggleSqlPractice: () => void;
  resetSelection: () => void;
  setDbConnected: (connected: boolean) => void;
  expandSqlPractice: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedCourseId: null,
  selectedChapterId: null,
  selectedStepId: null,
  selectedMajorId: null,
  currentTab: "learn",
  sidebarCollapsed: false,
  sqlPracticeCollapsed: true,
  dbConnected: false,
  sqlPracticeAutoExpanded: false,

  // Actions
  setSelectedCourse: (courseId) => set({ selectedCourseId: courseId }),
  setSelectedChapter: (chapterId) => set({ selectedChapterId: chapterId }),
  setSelectedStep: (stepId) => set({ selectedStepId: stepId }),
  setSelectedMajor: (majorId) => set({ selectedMajorId: majorId }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleSqlPractice: () => set((state) => ({ sqlPracticeCollapsed: !state.sqlPracticeCollapsed })),
  expandSqlPractice: () => set({ sqlPracticeCollapsed: false, sqlPracticeAutoExpanded: true }),
  setDbConnected: (connected) => set({ dbConnected: connected }),
  resetSelection: () =>
    set({
      selectedCourseId: null,
      selectedChapterId: null,
      selectedStepId: null,
    }),
}));
