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

  private static mgcaMockCourses: CourseInfo[] = [
    {
      id: "1",
      contentDir: "mgca-architecture",
      title: "GaussDB 架构与原理",
      description: "学习 GaussDB 核心架构、存储引擎、WAL 机制、查询处理和优化原理",
      status: ["online", "test"],
    },
    {
      id: "2",
      contentDir: "mgca-installation",
      title: "安装与配置",
      description: "掌握 GaussDB 安装部署、参数配置和性能调优方法",
      status: ["online", "test"],
    },
    {
      id: "3",
      contentDir: "mgca-sql-development",
      title: "SQL 开发基础",
      description: "学习 SQL 基础语法、DDL/DML 操作、查询优化和高级 SQL 特性",
      status: ["online", "test"],
    },
    {
      id: "4",
      contentDir: "mgca-performance-tuning",
      title: "性能调优",
      description: "掌握 GaussDB 性能监控、SQL 优化和参数调整方法",
      status: ["online", "test"],
    },
    {
      id: "5",
      contentDir: "mgca-backup-recovery",
      title: "备份与恢复",
      description: "学习 GaussDB 备份恢复策略、灾难恢复和数据迁移方法",
      status: ["online", "test"],
    },
    {
      id: "6",
      contentDir: "mgca-high-availability",
      title: "高可用架构",
      description: "掌握 GaussDB 主备切换、负载均衡和故障处理机制",
      status: ["online", "test"],
    },
    {
      id: "7",
      contentDir: "mgca-security",
      title: "安全管理",
      description: "学习 GaussDB 权限控制、审计日志和数据安全最佳实践",
      status: ["online", "test"],
    },
  ];

  private static currentMajorId: string = "opengauss";

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

  private static mgcaMockCourseDetails: Record<string, CourseDetail> = {
    "1": {
      title: "GaussDB 架构与原理",
      description: "学习 GaussDB 核心架构、存储引擎、WAL 机制、查询处理和优化原理",
      logo: "./assets/logo.png",
      poster: "./assets/poster.png",
      cover: "./assets/cover.png",
      containerLiveTime: "120",
      introduction: "1-intro",
      chapters: [
        {
          content_dir: "theory-intro",
          title: "架构原理学习",
          description: "学习 GaussDB 核心架构、存储引擎、WAL 机制、查询处理和优化原理",
          estimated_time: "60 min",
        },
        {
          content_dir: "lab-exercises",
          title: "实验练习",
          description: "通过实际实验加深对 GaussDB 架构的理解，包括进程监控、内存配置、查询优化等实践",
          estimated_time: "60 min",
        },
      ],
    },
    "2": {
      title: "安装与配置",
      description: "掌握 GaussDB 安装部署、参数配置和性能调优方法",
      logo: "./assets/logo.png",
      poster: "./assets/poster.png",
      cover: "./assets/cover.png",
      containerLiveTime: "120",
      introduction: "2-intro",
      chapters: [
        {
          content_dir: "theory-intro",
          title: "理论学习",
          description: "掌握 GaussDB 安装部署、参数配置和性能调优方法",
          estimated_time: "60 min",
        },
        {
          content_dir: "lab-exercises",
          title: "实验练习",
          description: "通过实际实验掌握 GaussDB 安装与配置方法",
          estimated_time: "60 min",
        },
      ],
    },
    "3": {
      title: "SQL 开发基础",
      description: "学习 SQL 基础语法、DDL/DML 操作、查询优化和高级 SQL 特性",
      logo: "./assets/logo.png",
      poster: "./assets/poster.png",
      cover: "./assets/cover.png",
      containerLiveTime: "120",
      introduction: "3-intro",
      chapters: [
        {
          content_dir: "theory-intro",
          title: "理论学习",
          description: "学习 SQL 基础语法、DDL/DML 操作、查询优化和高级 SQL 特性",
          estimated_time: "60 min",
        },
        {
          content_dir: "lab-exercises",
          title: "实验练习",
          description: "通过实际实验加深对SQL的理解",
          estimated_time: "60 min",
        },
      ],
    },
    "4": {
      title: "性能调优",
      description: "掌握 GaussDB 性能监控、SQL 优化和参数调整方法",
      logo: "./assets/logo.png",
      poster: "./assets/poster.png",
      cover: "./assets/cover.png",
      containerLiveTime: "120",
      introduction: "4-intro",
      chapters: [
        {
          content_dir: "theory-intro",
          title: "理论学习",
          description: "掌握 GaussDB 性能监控、SQL 优化和参数调整方法",
          estimated_time: "60 min",
        },
        {
          content_dir: "lab-exercises",
          title: "实验练习",
          description: "通过实际实验加深对性能调优的理解",
          estimated_time: "60 min",
        },
      ],
    },
    "5": {
      title: "备份与恢复",
      description: "学习 GaussDB 备份恢复策略、灾难恢复和数据迁移方法",
      logo: "./assets/logo.png",
      poster: "./assets/poster.png",
      cover: "./assets/cover.png",
      containerLiveTime: "120",
      introduction: "5-intro",
      chapters: [
        {
          content_dir: "theory-intro",
          title: "理论学习",
          description: "学习 GaussDB 备份恢复策略、灾难恢复和数据迁移方法",
          estimated_time: "60 min",
        },
        {
          content_dir: "lab-exercises",
          title: "实验练习",
          description: "通过实际实验加深对备份与恢复的理解",
          estimated_time: "60 min",
        },
      ],
    },
    "6": {
      title: "高可用架构",
      description: "掌握 GaussDB 主备切换、负载均衡和故障处理机制",
      logo: "./assets/logo.png",
      poster: "./assets/poster.png",
      cover: "./assets/cover.png",
      containerLiveTime: "120",
      introduction: "6-intro",
      chapters: [
        {
          content_dir: "theory-intro",
          title: "理论学习",
          description: "掌握 GaussDB 主备切换、负载均衡和故障处理机制",
          estimated_time: "60 min",
        },
        {
          content_dir: "lab-exercises",
          title: "实验练习",
          description: "通过实际实验加深对高可用架构的理解",
          estimated_time: "60 min",
        },
      ],
    },
    "7": {
      title: "安全管理",
      description: "学习 GaussDB 权限控制、审计日志和数据安全最佳实践",
      logo: "./assets/logo.png",
      poster: "./assets/poster.png",
      cover: "./assets/cover.png",
      containerLiveTime: "120",
      introduction: "7-intro",
      chapters: [
        {
          content_dir: "theory-intro",
          title: "理论学习",
          description: "学习 GaussDB 权限控制、审计日志和数据安全最佳实践",
          estimated_time: "60 min",
        },
        {
          content_dir: "lab-exercises",
          title: "实验练习",
          description: "通过实际实验加深对安全管理的理解",
          estimated_time: "60 min",
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
    "1-view-and-index": {
      title: "视图与索引",
      description: "学习有关数据库视图和索引的相关知识",
      steps: [
        { title: "Step 1 - 创建视图", md_file: "step1.md" },
        { title: "Step 2 - 创建索引", md_file: "step2.md" },
        { title: "Step 3 - 使用视图和索引", md_file: "step3.md" },
      ],
      estimatedTime: "20 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "opengauss-3.0.0" },
    },
  };

  private static mgcaMockChapterDetails: Record<string, ChapterDetail> = {
    "1-theory-intro": {
      title: "架构原理学习",
      description: "学习 GaussDB 核心架构、存储引擎、WAL 机制、查询处理和优化原理",
      steps: [
        { title: "Step 1 - GaussDB 核心架构", md_file: "step1.md" },
        { title: "Step 2 - 存储引擎与 WAL 机制", md_file: "step2.md" },
        { title: "Step 3 - 查询处理与优化", md_file: "step3.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "1-lab-exercises": {
      title: "实验练习",
      description: "通过实际实验加深对 GaussDB 架构的理解",
      steps: [
        { title: "实验 1 - 基础架构探索", md_file: "lab1.md" },
        { title: "实验 2 - 存储引擎实践", md_file: "lab2.md" },
        { title: "实验 3 - 查询优化实践", md_file: "lab3.md" },
        { title: "实验 4 - WAL 机制实践", md_file: "lab4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "2-theory-intro": {
      title: "理论学习",
      description: "掌握 GaussDB 安装部署、参数配置和性能调优方法",
      steps: [
        { title: "Step 1", md_file: "step1.md" },
        { title: "Step 2", md_file: "step2.md" },
        { title: "Step 3", md_file: "step3.md" },
        { title: "Step 4", md_file: "step4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "2-lab-exercises": {
      title: "实验练习",
      description: "通过实际实验掌握 GaussDB 安装与配置方法",
      steps: [
        { title: "实验 1", md_file: "lab1.md" },
        { title: "实验 2", md_file: "lab2.md" },
        { title: "实验 3", md_file: "lab3.md" },
        { title: "实验 4", md_file: "lab4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "3-theory-intro": {
      title: "理论学习",
      description: "学习 SQL 基础语法、DDL/DML 操作、查询优化和高级 SQL 特性",
      steps: [
        { title: "Step 1", md_file: "step1.md" },
        { title: "Step 2", md_file: "step2.md" },
        { title: "Step 3", md_file: "step3.md" },
        { title: "Step 4", md_file: "step4.md" },
        { title: "Step 5", md_file: "step5.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "3-lab-exercises": {
      title: "实验练习",
      description: "通过实际实验加深对SQL的理解",
      steps: [
        { title: "实验 1", md_file: "lab1.md" },
        { title: "实验 2", md_file: "lab2.md" },
        { title: "实验 3", md_file: "lab3.md" },
        { title: "实验 4", md_file: "lab4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "4-theory-intro": {
      title: "理论学习",
      description: "掌握 GaussDB 性能监控、SQL 优化和参数调整方法",
      steps: [
        { title: "Step 1", md_file: "step1.md" },
        { title: "Step 2", md_file: "step2.md" },
        { title: "Step 3", md_file: "step3.md" },
        { title: "Step 4", md_file: "step4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "4-lab-exercises": {
      title: "实验练习",
      description: "通过实际实验加深对性能调优的理解",
      steps: [
        { title: "实验 1", md_file: "lab1.md" },
        { title: "实验 2", md_file: "lab2.md" },
        { title: "实验 3", md_file: "lab3.md" },
        { title: "实验 4", md_file: "lab4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "5-theory-intro": {
      title: "理论学习",
      description: "学习 GaussDB 备份恢复策略、灾难恢复和数据迁移方法",
      steps: [
        { title: "Step 1", md_file: "step1.md" },
        { title: "Step 2", md_file: "step2.md" },
        { title: "Step 3", md_file: "step3.md" },
        { title: "Step 4", md_file: "step4.md" },
        { title: "Step 5", md_file: "step5.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "5-lab-exercises": {
      title: "实验练习",
      description: "通过实际实验加深对备份与恢复的理解",
      steps: [
        { title: "实验 1", md_file: "lab1.md" },
        { title: "实验 2", md_file: "lab2.md" },
        { title: "实验 3", md_file: "lab3.md" },
        { title: "实验 4", md_file: "lab4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "6-theory-intro": {
      title: "理论学习",
      description: "掌握 GaussDB 主备切换、负载均衡和故障处理机制",
      steps: [
        { title: "Step 1", md_file: "step1.md" },
        { title: "Step 2", md_file: "step2.md" },
        { title: "Step 3", md_file: "step3.md" },
        { title: "Step 4", md_file: "step4.md" },
        { title: "Step 5", md_file: "step5.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "6-lab-exercises": {
      title: "实验练习",
      description: "通过实际实验加深对高可用架构的理解",
      steps: [
        { title: "实验 1", md_file: "lab1.md" },
        { title: "实验 2", md_file: "lab2.md" },
        { title: "实验 3", md_file: "lab3.md" },
        { title: "实验 4", md_file: "lab4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "7-theory-intro": {
      title: "理论学习",
      description: "学习 GaussDB 权限控制、审计日志和数据安全最佳实践",
      steps: [
        { title: "Step 1", md_file: "step1.md" },
        { title: "Step 2", md_file: "step2.md" },
        { title: "Step 3", md_file: "step3.md" },
        { title: "Step 4", md_file: "step4.md" },
        { title: "Step 5", md_file: "step5.md" },
        { title: "Step 6", md_file: "step6.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
    },
    "7-lab-exercises": {
      title: "实验练习",
      description: "通过实际实验加深对安全管理的理解",
      steps: [
        { title: "实验 1", md_file: "lab1.md" },
        { title: "实验 2", md_file: "lab2.md" },
        { title: "实验 3", md_file: "lab3.md" },
        { title: "实验 4", md_file: "lab4.md" },
      ],
      estimatedTime: "60 min",
      introduction: "intro.md",
      finish: "finish.md",
      backend: { imageId: "gaussdb-5.0.0" },
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
    if (MockCourseService.currentMajorId === "mgca") {
      return MockCourseService.mgcaMockCourses;
    }
    return MockCourseService.mockCourses;
  }

  async getCourseDetail(courseId: string): Promise<CourseDetail> {
    console.log(`[Mock] Getting course detail: ${courseId}`);
    let detail: CourseDetail | undefined;
    if (MockCourseService.currentMajorId === "mgca") {
      detail = MockCourseService.mgcaMockCourseDetails[courseId];
    }
    if (!detail) {
      detail = MockCourseService.mockCourseDetails[courseId];
    }
    if (!detail) {
      throw new Error(`Course not found: ${courseId}`);
    }
    return detail;
  }

  async getCourseIntroduction(courseId: string): Promise<StepContent> {
    // 返回默认的介绍内容（实际文件在文件系统中）
    return {
      title: `课程介绍 - ${courseId}`,
      content: "此课程的介绍内容正在开发中...（注：在实际 Tauri 环境中，介绍将从文件中读取）",
      sqlCommands: [],
    };
  }

  async getChapterDetail(
    courseId: string,
    chapterDir: string
  ): Promise<ChapterDetail> {
    console.log(`[Mock] Getting chapter detail: ${courseId}/${chapterDir}`);
    const key = `${courseId}-${chapterDir}`;
    let detail: ChapterDetail | undefined;
    if (MockCourseService.currentMajorId === "mgca") {
      detail = MockCourseService.mgcaMockChapterDetails[key];
    }
    if (!detail) {
      detail = MockCourseService.mockChapterDetails[key];
    }
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
    MockCourseService.currentMajorId = majorId;
  }
}
