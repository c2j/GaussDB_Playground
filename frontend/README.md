# openGauss Playground - 前台使用指南

## 功能特性

### 📚 课程学习系统
- **课程浏览**：从侧边栏查看所有可用课程
- **章节导航**：展开课程查看所有章节，点击章节自动选择第一个步骤
- **步骤进度**：清晰显示当前学习进度，支持步骤间快速切换
- **Markdown 渲染**：富文本课程内容展示，支持代码高亮
- **SQL 命令执行**：步骤中的 SQL 代码块自带执行按钮

### ⚡ 试验场
- **数据库连接**：配置远程 openGauss 数据库连接参数
- **SQL 编辑器**：编写和执行 SQL 查询
- **终端模拟器**：实时显示执行结果和错误信息
- **结果展示**：表格形式展示查询结果
- **配置保存**：保存数据库连接配置

### 🎨 UI/UX 特性
- **响应式设计**：适配不同屏幕尺寸
- **暗黑模式**：支持亮色/暗色主题切换
- **加载状态**：优雅的加载动画和骨架屏
- **错误处理**：友好的错误提示信息
- **流畅动画**：平滑的过渡效果

## 使用说明

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:1420/ 运行

### 构建生产版本

```bash
npm run build
```

### 开始学习

1. **选择课程**
   - 点击左侧边栏中的课程卡片
   - 查看课程描述和进度

2. **选择章节**
   - 点击课程展开章节列表
   - 选择要学习的章节

3. **完成步骤**
   - 阅读步骤内容
   - 点击 SQL 命令按钮执行代码（可选）
   - 点击"标记为已完成"按钮
   - 自动跳转到下一步骤

### 使用试验场

1. **配置连接**
   - 切换到"试验场"标签页
   - 填写数据库连接信息：
     - 主机（如：127.0.0.1）
     - 端口（如：5432）
     - 用户名（如：postgres）
     - 密码
     - 数据库名（如：postgres）

2. **测试连接**
   - 点击"测试连接"按钮
   - 查看连接状态反馈

3. **保存配置**
   - 点击"保存配置"保存连接参数
   - 下次打开时自动加载

4. **执行查询**
   - 在 SQL 编辑器中输入查询
   - 点击"执行"按钮运行
   - 在终端查看结果

## 技术栈

### 前端
- **React 18**：UI 框架
- **TypeScript**：类型安全
- **Vite 4**：构建工具
- **TailwindCSS 3**：样式框架
- **React Query 5**：数据获取和缓存
- **Zustand**：状态管理
- **react-markdown**：Markdown 渲染
- **lucide-react**：图标库

### 兼容性
- **Chrome 86+**：支持较旧版本浏览器
- **Safari 14+**：现代 Safari 浏览器
- **Firefox 78+**：现代 Firefox 浏览器
- **Edge 88+**：现代 Edge 浏览器

## 项目结构

```
frontend/
├── api/                    # Tauri API 调用（预留）
├── components/              # React 组件
│   ├── Sidebar.tsx        # 侧边栏（课程列表）
│   ├── CourseViewer.tsx    # 课程学习页面
│   ├── Playground.tsx      # 试验场页面
│   ├── ConnectionForm.tsx  # 连接配置表单
│   ├── MarkdownRenderer.tsx # Markdown 渲染器
│   └── SqlCommandButton.tsx # SQL 命令按钮
├── hooks/                  # 自定义 React Hooks
│   ├── useCourse.ts       # 课程数据 Hook
│   ├── useProgress.ts     # 进度管理 Hook
│   └── useDatabase.ts     # 数据库操作 Hook
├── services/               # 服务层（Service Contract 模式）
│   ├── interfaces/         # 服务接口定义
│   ├── impl/
│   │   ├── mock/         # Mock 实现（浏览器开发）
│   │   └── tauri/       # Tauri 实现（待后端）
│   └── index.ts          # 服务工厂
├── store/                 # 状态管理
│   └── app.store.ts      # Zustand store
├── types/                 # TypeScript 类型
│   ├── index.ts
│   └── env.d.ts
├── App.tsx               # 主应用组件
└── index.tsx             # 应用入口
```

## Mock 数据

当前前端使用 Mock 数据进行开发，无需后端即可完整体验：

### 可用课程
1. **1小时快速入门openGauss数据库**
   - 创建数据表（3个步骤）
   - 操作数据库（3个步骤）
   - 视图与索引（待开发）

2. **Git分布式版本控制工具**（待开发）

### Mock 功能
- ✅ 课程列表加载
- ✅ 章节详情加载
- ✅ 步骤内容加载
- ✅ 学习进度管理
- ✅ 数据库连接测试
- ✅ SQL 查询执行（模拟）

## 下一步

### 后端开发（src-tauri）

1. **课程管理 API**
   - 读取 courses/opengauss 目录
   - 解析 JSON 和 Markdown 文件
   - 返回结构化数据

2. **进度管理 API**
   - SQLite 数据库初始化
   - CRUD 操作
   - 查询和更新进度

3. **数据库连接 API**
   - TCP 连接管理
   - SQL 查询执行
   - 结果集处理

4. **配置存储**
   - 加密保存数据库密码
   - 持久化配置

### 功能扩展

1. **高级功能**
   - 代码自动补全
   - SQL 语法检查
   - 查询历史记录
   - 快捷键支持
   - 多标签页

2. **用户体验**
   - 进度可视化图表
   - 成就系统
   - 证书生成
   - 导出笔记

## 开发规范

遵循项目根目录 `AGENTS.md` 中的规范：
- ✅ 服务契约化（Service Contract 模式）
- ✅ Mock 先行（前端独立开发）
- ✅ TypeScript 严格模式
- ✅ 防御性编程（空值检查）
- ✅ React Query 缓存策略
- ✅ TailwindCSS 样式规范

## 故障排除

### 问题：页面显示空白
- 打开浏览器开发者工具（F12）
- 检查控制台是否有错误
- 刷新页面（Ctrl+Shift+R）强制重新加载

### 问题：Mock 数据加载失败
- 检查 `frontend/services/impl/mock/course.service.ts`
- 确认 Mock 数据结构正确

### 问题：样式显示异常
- 清除浏览器缓存
- 检查 TailwindCSS 配置
- 确认浏览器兼容性

## 贡献指南

1. 遵循现有代码风格
2. 添加类型定义
3. 编写 Mock 数据
4. 更新此文档
5. 提交前测试功能

---

**当前版本**：v1.0.0  
**最后更新**：2026-02-07
