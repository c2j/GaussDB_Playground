import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { CourseViewer } from "./components/CourseViewer";
import { Playground } from "./components/Playground";
import { useAppStore } from "./store/app.store";

// 检测 Tauri 环境
const isTauri = !!(window as any).__TAURI__;
console.log("[App] Running in Tauri environment:", isTauri);
console.log("[App] window.__TAURI__:", (window as any).__TAURI__);

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { currentTab } = useAppStore();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 标签页导航 */}
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => useAppStore.getState().setCurrentTab("learn")}
              className={`px-6 py-3 font-medium transition-colors ${
                currentTab === "learn"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              课程学习
            </button>
            <button
              onClick={() => useAppStore.getState().setCurrentTab("playground")}
              className={`px-6 py-3 font-medium transition-colors ${
                currentTab === "playground"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              试验场
            </button>
          </div>

          {/* 标签页内容 */}
          {currentTab === "learn" && <CourseViewer />}
          {currentTab === "playground" && <Playground />}
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
