// Markdown 渲染器组件
import ReactMarkdown from "react-markdown";
import { SqlCommandButton } from "./SqlCommandButton";
import { useMarkStepComplete } from "../hooks";

export function MarkdownRenderer({
  content,
  onExecuteSql,
  courseId,
  chapterId,
  stepId,
}: {
  content: string;
  sqlCommands?: Array<{ sql: string; description?: string }>;
  onExecuteSql?: (sql: string) => void;
  courseId?: string;
  chapterId?: string;
  stepId?: string;
}) {
  const markStepComplete = useMarkStepComplete();
  const userId = "default_user"; // TODO: 从用户认证获取

  const handleComplete = () => {
    if (courseId && chapterId && stepId) {
      markStepComplete.mutate({
        userId,
        courseId,
        chapterId,
        stepId,
      });
    }
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          // 自定义代码块渲染
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeContent = String(children).replace(/\n$/, "");

            // 检查是否是命令块（包含 [[command]]{{RUN}}）
            const commandMatches = codeContent.match(/\[\[([^\]]+)\]\]\{\{RUN\}\}/g);
            const isCommandBlock = commandMatches && commandMatches.length > 0;

            if (language === "sql") {
              return (
                <div className="relative">
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                  {onExecuteSql && (
                    <SqlCommandButton
                      sql={codeContent}
                      onExecute={onExecuteSql}
                    />
                  )}
                </div>
              );
            }

            // 处理命令块（非sql代码块）
            if (isCommandBlock) {
              const commands = commandMatches.map((c) => {
                const match = c.match(/\[\[([^\]]+)\]/);
                return match ? match[1] : '';
              }).filter(Boolean);

              return (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 my-4">
                  <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">📋 命令执行</div>
                  <div className="space-y-2">
                    {commands.map((cmd, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                      >
                        <code className="flex-1 text-sm font-mono text-slate-800 dark:text-slate-200 overflow-x-auto">
                          {cmd}
                        </code>
                        <span className="text-xs px-2 py-1 bg-amber-600 text-white rounded">
                          RUN
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // 普通内联代码
            if (!className) {
              return (
                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm text-slate-800 dark:text-slate-200" {...props}>
                  {children}
                </code>
              );
            }

            // 其他代码块
            return (
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {/* 完成按钮 */}
      {courseId && chapterId && stepId && (
        <button
          onClick={handleComplete}
          disabled={markStepComplete.isPending}
          className="mt-8 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-lg transition-colors"
        >
          {markStepComplete.isPending ? "标记中..." : "标记为已完成"}
        </button>
      )}
    </div>
  );
}
