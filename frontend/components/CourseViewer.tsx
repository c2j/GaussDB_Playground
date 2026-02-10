import { useAppStore } from "../store/app.store";
import { useChapterDetail, useStepContent, useCourseIntroduction } from "../hooks";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { QueryResultTable } from "./QueryResultTable";
import { useState } from "react";
import type { QueryResult } from "../services/interfaces/database.service";
import { useExecuteQuery, useLoadDbConfig } from "../hooks";

export function CourseViewer() {
  const { selectedCourseId, selectedChapterId, dbConnected, sqlPracticeCollapsed, toggleSqlPractice } = useAppStore();
  const [activeStep, setActiveStep] = useState(0);

  // SQL Editor state
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState(150);

  // SQL hooks
  const executeQuery = useExecuteQuery();
  const { data: savedConfig } = useLoadDbConfig();

  // Get course introduction
  const { data: courseIntroduction, isLoading: introLoading } = useCourseIntroduction(
    selectedCourseId || ""
  );

  // Get chapter details
  const { data: chapterDetail, isLoading: chapterLoading } = useChapterDetail(
    selectedCourseId || "",
    selectedChapterId || ""
  );

  // Get step content
  const { data: stepContent, isLoading: stepLoading } = useStepContent(
    selectedCourseId || "",
    selectedChapterId || "",
    chapterDetail?.steps[activeStep]?.md_file || ""
  );

  const handlePreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleNextStep = () => {
    if (chapterDetail && activeStep < chapterDetail.steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  // SQL handlers
  const handleSqlExecute = async (sql: string) => {
    const config = savedConfig || {
      host: "localhost",
      port: 5432,
      database: "postgres",
      username: "",
      password: ""
    };
    setQueryError(null);
    try {
      const result = await executeQuery.mutateAsync({ config, sql });
      setQueryResult(result);
    } catch (error: any) {
      setQueryError(error.message || "查询执行失败");
      setQueryResult(null);
    }
  };

  const handleClearSql = () => {
    setSqlQuery("");
    setQueryResult(null);
    setQueryError(null);
  };

  const exampleQueries = [
    "-- 查看所有表\nSELECT * FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');",
    "-- 查询当前表\nSELECT * FROM clients LIMIT 10;",
    "-- 统计数据\nSELECT COUNT(*) as total FROM clients;"
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 上半部分：学习内容（可滚动） */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedCourseId ? (
          <div>
            {!selectedChapterId ? (
              introLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">加载课程介绍中...</p>
                  </div>
                </div>
              ) : courseIntroduction ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
                  <MarkdownRenderer
                    content={courseIntroduction.content}
                    sqlCommands={courseIntroduction.sqlCommands}
                    courseId={selectedCourseId}
                    chapterId=""
                    stepId=""
                    onExecuteSql={(sql) => {
                      setSqlQuery(sql);
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              )
            ) : (
              <>
                {chapterLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  </div>
                ) : chapterDetail ? (
                  <div>
                    {/* Chapter Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        {chapterDetail.title}
                      </h1>
                      <p className="text-slate-600 dark:text-slate-300">
                        {chapterDetail.description}
                      </p>
                    </div>

                    {/* Step Navigation */}
                    {selectedChapterId && chapterDetail.steps.length > 0 && (
                      <>
                        <div className="mb-6 flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-slate-600 dark:text-slate-400">步骤:</span>
                          {chapterDetail.steps.map((step: any, index: number) => (
                            <button
                              key={step.md_file}
                              onClick={() => setActiveStep(index)}
                              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                                activeStep === index
                                  ? "bg-primary-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                              }`}
                            >
                              {step.title}
                            </button>
                          ))}
                        </div>

                        {/* Step Content */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                          {stepLoading ? (
                            <div className="flex items-center justify-center h-64">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                          ) : stepContent ? (
                            <MarkdownRenderer
                              content={stepContent.content}
                              sqlCommands={stepContent.sqlCommands}
                              courseId={selectedCourseId}
                              chapterId={selectedChapterId}
                              stepId={chapterDetail.steps[activeStep].md_file}
                              onExecuteSql={(sql) => {
                                setSqlQuery(sql);
                              }}
                            />
                          ) : (
                            <p className="text-slate-500 dark:text-slate-400">
                              步骤内容加载失败
                            </p>
                          )}
                        </div>

                        {/* Step Navigation Buttons */}
                        <div className="mt-6 flex justify-between items-center">
                          <button
                            onClick={handlePreviousStep}
                            disabled={activeStep === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            上一步
                          </button>

                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            步骤 {activeStep + 1} / {chapterDetail.steps.length}
                          </div>

                          <button
                            onClick={handleNextStep}
                            disabled={activeStep === chapterDetail.steps.length - 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                          >
                            下一步
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    章节信息加载失败
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                欢迎来到 openGauss 学习平台
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                请从左侧选择一个课程开始学习
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 下半部分：SQL交互区域（固定高度，可调整） */}
      <div className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        {sqlPracticeCollapsed ? (
          <div className="flex items-center justify-center p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" onClick={toggleSqlPractice}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4V7" />
              </svg>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">SQL 实践</span>
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4V7" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  SQL 实践
                </h3>
                <button
                  onClick={toggleSqlPractice}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                {/* Connection Status Indicator */}
                {dbConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    已连接
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    未连接
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditorHeight(Math.max(100, editorHeight - 50))}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7 7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditorHeight(Math.min(400, editorHeight + 50))}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7 7-7" />
                  </svg>
                </button>
              </div>
            </div>

            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="-- 在此输入 SQL 语句进行实践&#10;-- 示例: SELECT * FROM clients;&#10;-- 使用上方步骤中的 SQL 命令会自动填充"
              style={{ height: `${editorHeight}px` }}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              spellCheck={false}
            />

            <div className="mt-3 space-y-3">
              {/* 快捷操作 */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleClearSql}
                  className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0117.138 21H7a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v12a2 2 0 01-2 2h-4l-2-2h-4z" />
                  </svg>
                  清空
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">示例查询:</span>
                {exampleQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => setSqlQuery(query)}
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-3 py-1.5 rounded border border-primary-300 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    {query.split('\n')[0].replace('--', '')}
                  </button>
                ))}
              </div>

              {/* 执行按钮 */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {!dbConnected && (
                    <span className="text-amber-600 dark:text-amber-400">
                      ⚠️ 请先在"试验场"标签页连接数据库
                    </span>
                  )}
                  {dbConnected && "💡 提示: 使用步骤中的 SQL 命令会自动填充"}
                </div>
                <button
                  onClick={() => sqlQuery.trim() && handleSqlExecute(sqlQuery)}
                  disabled={!sqlQuery.trim() || executeQuery.isPending || !dbConnected}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {executeQuery.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      执行中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      执行查询
                    </>
                  )}
                </button>
              </div>

              {/* Query Results */}
              {queryResult && <QueryResultTable result={queryResult} />}

              {/* Query Error */}
              {queryError && (
                <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.215V6.741c0-1.548 1.963-2.215 3.464-2.215H8.964c-1.54 0-3.502.667-3.502 2.215v6.056c0 1.548 1.963 2.215 3.464 2.215zm-1.457 6h-1.457c-.399 0-.756-.24-.884-.6L4.22 13.422c-.166-.246-.233-.526-.185-.816l.057-1.968c.097-.448.432-.726.868-.726h4.394c.436 0 .771.278.868.726l.057 1.968c.048.29.019.57-.185.816l-1.437.764c-.128.36-.485.6-.884.6z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                        查询执行失败
                      </h4>
                      <pre className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                        {queryError}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
