import type {
  ICourseService,
  CourseInfo,
  CourseDetail,
  ChapterDetail,
  StepContent,
  MajorInfo,
} from "../../interfaces/course.service";

export class MockCourseService implements ICourseService {
  private static mockCourses: CourseInfo[] = [
    {
      id: "1",
      contentDir: "openGauss-101",
      title: "1小时快速入门openGauss数据库",
      description: "使用openGauss构建金融场景下的数据库",
      status: ["online", "test"],
    },
    {
      id: "2",
      contentDir: "git-101",
      title: "Git分布式版本控制工具",
      description: "学习Git分布式版本控制工具的基础知识",
      status: ["online", "test"],
    },
  ];

  private static mockCourseDetails: Record<string, CourseDetail> = {
    "1": {
      title: "1小时快速入门openGauss数据库",
      description: "使用openGauss构建金融场景下的数据库, 模拟金融场景下的业务实现。",
      logo: "./assets/logo.png",
      poster: "./assets/poster.png",
      cover: "./assets/cover.png",
      containerLiveTime: "90",
      chapters: [
        {
          content_dir: "create-schema",
          title: "创建数据表",
          description: "学习如何在openGauss数据库中创建数据库并进行初始化",
          estimated_time: "20 min",
        },
        {
          content_dir: "manipulate-data",
          title: "操作数据库",
          description: "学习如何对数据库进行基本的增删改查操作",
          estimated_time: "20 min",
        },
        {
          content_dir: "view-and-index",
          title: "视图与索引",
          description: "学习有关数据库视图和索引的相关知识",
          estimated_time: "20 min",
        },
      ],
    },
  };

    private static mockChapterDetails: Record<string, ChapterDetail> = {
    "1-create-schema": {
      title: "创建数据表",
      description: "学习如何在openGauss数据库中创建数据库并插入数据",
      steps: [
        { title: "Step 1 - 创建Schema", md_file: "step1.md" },
        { title: "Step 2 - 创建Table", md_file: "step2.md" },
        { title: "Step 3 - 导入Client数据", md_file: "step3.md" },
      ],
      estimatedTime: "20 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "opengauss-3.0.0" },
    },
    "1-manipulate-data": {
      title: "操作数据库",
      description: "学习如何对数据库进行基本的增删改查操作",
      steps: [
        { title: "Step 1 - 插入数据", md_file: "step1.md" },
        { title: "Step 2 - 查询数据", md_file: "step2.md" },
        { title: "Step 3 - 更新数据", md_file: "step3.md" },
      ],
      estimatedTime: "20 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "opengauss-3.0.0" },
    },
  };

  private static mockStepContents: Record<string, StepContent> = {
    "1-create-schema-step1": {
      title: "Step 1 - 创建Schema",
      content: `### Schema

\`Schema\`又称作模式。每个数据库包含一个或多个\`Schema\`。数据库中的每个\`Schema\`包含表和其他类型的对象。

## 任务

使用gsql工具登录数据库：

\`\`\`sql
gsql -d postgres -p 5432 -r -h 127.0.0.1
\`\`\`

输入密码：\`openGauss@1234\`

创建数据库\`finance\`：

\`\`\`sql
CREATE DATABASE finance ENCODING 'UTF8' template = template0;
\`\`\`

连接\`finance\`数据库：

\`\`\`sql
\connect finance
\`\`\`

创建名为\`finance\`的\`Schema\`，并设置\`finance\`为当前的\`Schema\`。

\`\`\`sql
CREATE SCHEMA finance;
\`\`\`

将默认搜索路径设为\`finance\`：

\`\`\`sql
SET search_path TO finance;
\`\`\`
`,
      sqlCommands: [
        {
          sql: "gsql -d postgres -p 5432 -r -h 127.0.0.1",
          description: "连接到数据库",
        },
        {
          sql: "CREATE DATABASE finance ENCODING 'UTF8' template = template0;",
          description: "创建 finance 数据库",
        },
      ],
    },
    "1-create-schema-step2": {
      title: "Step 2 - 创建Table",
      content: `### 创建表

在本步骤中，我们将创建客户表。

## 任务

创建客户表：

\`\`\`sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

创建完成后，可以使用 \\\\d 命令查看表结构。

\`\`\`sql
\\d clients
\`\`\`
`,
      sqlCommands: [
        {
          sql: `CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
          description: "创建 clients 表",
        },
        {
          sql: "\\d clients",
          description: "查看表结构",
        },
      ],
    },
    "1-create-schema-step3": {
      title: "Step 3 - 导入Client数据",
      content: `### 导入数据

现在我们将一些示例数据插入到客户表中。

## 任务

插入示例客户数据：

\`\`\`sql
INSERT INTO clients (name, email, phone) VALUES
('张三', 'zhangsan@example.com', '13800138000'),
('李四', 'lisi@example.com', '13800138001'),
('王五', 'wangwu@example.com', '13800138002');
\`\`\`

验证数据已插入：

\`\`\`sql
SELECT * FROM clients;
\`\`\`
`,
      sqlCommands: [
        {
          sql: `INSERT INTO clients (name, email, phone) VALUES
('张三', 'zhangsan@example.com', '13800138000'),
('李四', 'lisi@example.com', '13800138001'),
('王五', 'wangwu@example.com', '13800138002');`,
          description: "插入客户数据",
        },
        {
          sql: "SELECT * FROM clients;",
          description: "查询客户数据",
        },
      ],
    },
    "1-manipulate-data-step1": {
      title: "Step 1 - 插入数据",
      content: `### 插入数据

学习如何使用 INSERT 语句插入数据。

## 任务

插入一条新记录：

\`\`\`sql
INSERT INTO clients (name, email, phone) 
VALUES ('赵六', 'zhaoliu@example.com', '13800138003');
\`\`\`
`,
      sqlCommands: [
        {
          sql: `INSERT INTO clients (name, email, phone) 
VALUES ('赵六', 'zhaoliu@example.com', '13800138003');`,
          description: "插入新客户",
        },
      ],
    },
    "1-manipulate-data-step2": {
      title: "Step 2 - 查询数据",
      content: `### 查询数据

学习如何使用 SELECT 语句查询数据。

## 任务

查询所有客户：

\`\`\`sql
SELECT * FROM clients ORDER BY created_at DESC;
\`\`\`

按名称查询：

\`\`\`sql
SELECT name, email FROM clients WHERE name LIKE '张%';
\`\`\`
`,
      sqlCommands: [
        {
          sql: "SELECT * FROM clients ORDER BY created_at DESC;",
          description: "查询所有客户（按创建时间降序）",
        },
        {
          sql: "SELECT name, email FROM clients WHERE name LIKE '张%';",
          description: "按名称模糊查询",
        },
      ],
    },
    "1-manipulate-data-step3": {
      title: "Step 3 - 更新数据",
      content: `### 更新数据

学习如何使用 UPDATE 语句更新数据。

## 任务

更新客户信息：

\`\`\`sql
UPDATE clients 
SET email = 'newemail@example.com' 
WHERE name = '张三';
\`\`\`

验证更新结果：

\`\`\`sql
SELECT * FROM clients WHERE name = '张三';
\`\`\`
`,
      sqlCommands: [
        {
          sql: "UPDATE clients SET email = 'newemail@example.com' WHERE name = '张三';",
          description: "更新张三的邮箱",
        },
        {
          sql: "SELECT * FROM clients WHERE name = '张三';",
          description: "验证更新结果",
        },
      ],
    },
  };

  async getCourses(): Promise<CourseInfo[]> {
    console.log("[Mock] Getting courses list");
    return MockCourseService.mockCourses;
  }

  async getCourseDetail(courseId: string): Promise<CourseDetail> {
    console.log(`[Mock] Getting course detail: ${courseId}`);
    const detail = MockCourseService.mockCourseDetails[courseId];
    if (!detail) {
      throw new Error(`Course not found: ${courseId}`);
    }
    return detail;
  }

  async getChapterDetail(
    courseId: string,
    chapterDir: string
  ): Promise<ChapterDetail> {
    console.log(`[Mock] Getting chapter detail: ${courseId}/${chapterDir}`);
    const key = `${courseId}-${chapterDir}`;
    const detail = MockCourseService.mockChapterDetails[key];
    if (!detail) {
      throw new Error(`Chapter not found: ${key}`);
    }
    return detail;
  }

  async getStepContent(
    courseId: string,
    chapterDir: string,
    stepFile: string
  ): Promise<StepContent> {
    console.log(`[Mock] Getting step content: ${courseId}/${chapterDir}/${stepFile}`);
    const key = `${courseId}-${chapterDir}-${stepFile}`;
    const content = MockCourseService.mockStepContents[key];
    if (!content) {
      // 返回默认内容
      return {
        title: `Step: ${stepFile}`,
        content: `这是一个演示步骤。\n\n步骤标题：${stepFile}\n\n此步骤的详细内容正在开发中...`,
        sqlCommands: [],
      };
    }
    return content;
  }

  async getMajors(): Promise<MajorInfo[]> {
    console.log("[Mock] Getting majors list");
    return [
      {
        id: "opengauss",
        name: "OpenGauss",
        path: "opengauss",
      },
      {
        id: "mgca",
        name: "Mgca",
        path: "mgca",
      },
    ];
  }

  async setCurrentMajor(majorId: string): Promise<void> {
    console.log(`[Mock] Setting current major to: ${majorId}`);
  }
}
