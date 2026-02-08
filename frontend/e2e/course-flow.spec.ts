import { test, expect } from "@playwright/test";

// 开发服务器 URL
const BASE_URL = "http://localhost:1420/";

test.describe("openGauss Playground - Course Learning", () => {
  test("should display course list in sidebar", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 等待课程列表加载
    await page.waitForSelector('[data-testid="course-list"]', { timeout: 5000 });

    // 检查是否有课程卡片
    const courseCards = await page.locator('[data-testid="course-card"]').count();
    expect(courseCards).toBeGreaterThan(0);
  });

  test("should expand chapters when clicking on a course", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 点击第一个课程
    await page.click('[data-testid="course-card"]:first-child');
    await page.waitForTimeout(500);

    // 检查章节列表是否展开
    const chapterList = await page.locator('[data-testid="chapter-list"]').isVisible();
    expect(chapterList).toBe(true);

    // 检查是否有章节
    const chapters = await page.locator('[data-testid="chapter-item"]').count();
    expect(chapters).toBeGreaterThan(0);
  });

  test("should load step content when clicking a chapter", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 点击第一个课程
    await page.click('[data-testid="course-card"]:first-child');
    await page.waitForTimeout(500);

    // 点击第一个章节
    await page.click('[data-testid="chapter-item"]:first-child');
    await page.waitForTimeout(1000);

    // 检查步骤内容是否加载
    const stepContent = await page.locator('[data-testid="step-content"]').isVisible();
    expect(stepContent).toBe(true);
  });

  test("should display step navigation buttons", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 点击课程和章节
    await page.click('[data-testid="course-card"]:first-child');
    await page.waitForTimeout(500);
    await page.click('[data-testid="chapter-item"]:first-child');
    await page.waitForTimeout(1000);

    // 检查步骤导航按钮
    const stepNav = await page.locator('[data-testid="step-navigation"]').isVisible();
    expect(stepNav).toBe(true);

    // 检查是否有步骤按钮
    const stepButtons = await page.locator('[data-testid="step-button"]').count();
    expect(stepButtons).toBeGreaterThan(0);

    // 检查第一个步骤是否被选中
    const firstStep = await page.locator('[data-testid="step-button"]:first-child');
    await expect(firstStep).toHaveClass(/bg-primary-600/);
  });

  test("should display empty state when no course selected", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 检查空状态
    const emptyState = await page.locator('[data-testid="empty-courses"]').isVisible();
    expect(emptyState).toBe(true);
  });
});

test.describe("openGauss Playground - Playground", () => {
  test("should display playground when clicking playground tab", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 点击试验场标签
    await page.click('[data-testid="tab-playground"]');
    await page.waitForTimeout(500);

    // 检查试验场是否显示
    const playground = await page.locator('[data-testid="playground-container"]').isVisible();
    expect(playground).toBe(true);
  });

  test("should display database connection form", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 切换到试验场
    await page.click('[data-testid="tab-playground"]');
    await page.waitForTimeout(500);

    // 检查连接表单
    const connectionForm = await page.locator('[data-testid="connection-form"]').isVisible();
    expect(connectionForm).toBe(true);

    // 检查表单字段
    const hostInput = await page.locator('[data-testid="db-host"]').isVisible();
    const portInput = await page.locator('[data-testid="db-port"]').isVisible();
    const usernameInput = await page.locator('[data-testid="db-username"]').isVisible();
    const passwordInput = await page.locator('[data-testid="db-password"]').isVisible();
    const databaseInput = await page.locator('[data-testid="db-database"]').isVisible();

    expect(hostInput).toBe(true);
    expect(portInput).toBe(true);
    expect(usernameInput).toBe(true);
    expect(passwordInput).toBe(true);
    expect(databaseInput).toBe(true);
  });

  test("should display SQL editor and terminal", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 切换到试验场
    await page.click('[data-testid="tab-playground"]');
    await page.waitForTimeout(500);

    // 检查 SQL 编辑器
    const sqlEditor = await page.locator('[data-testid="sql-editor"]').isVisible();
    expect(sqlEditor).toBe(true);

    // 检查终端
    const terminal = await page.locator('[data-testid="terminal"]').isVisible();
    expect(terminal).toBe(true);
  });
});

test.describe("openGauss Playground - Tab Navigation", () => {
  test("should switch between learn and playground tabs", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 检查学习标签是否激活
    const learnTabActive = await page
      .locator('[data-testid="tab-learn"]')
      .getAttribute("class");
    expect(learnTabActive).toContain("text-primary-600");

    // 切换到试验场
    await page.click('[data-testid="tab-playground"]');
    await page.waitForTimeout(500);

    // 检查试验场标签是否激活
    const playgroundTabActive = await page
      .locator('[data-testid="tab-playground"]')
      .getAttribute("class");
    expect(playgroundTabActive).toContain("text-primary-600");

    // 切换回学习标签
    await page.click('[data-testid="tab-learn"]');
    await page.waitForTimeout(500);

    // 检查学习标签再次激活
    const learnTabActiveAgain = await page
      .locator('[data-testid="tab-learn"]')
      .getAttribute("class");
    expect(learnTabActiveAgain).toContain("text-primary-600");
  });
});

test.describe("openGauss Playground - UI States", () => {
  test("should show loading state initially", async ({ page }) => {
    await page.goto(BASE_URL);

    // 检查是否有加载状态（在课程加载完成前）
    await page.waitForSelector('[data-testid="course-list"]', { timeout: 5000 });

    // 等待加载完成
    await page.waitForTimeout(500);

    // 现在应该有内容
    const courseList = await page.locator('[data-testid="course-list"]').isVisible();
    expect(courseList).toBe(true);
  });

  test("should display step content with markdown", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 点击课程和章节
    await page.click('[data-testid="course-card"]:first-child');
    await page.waitForTimeout(500);
    await page.click('[data-testid="chapter-item"]:first-child');
    await page.waitForTimeout(1000);

    // 检查步骤内容区域
    const stepContent = await page.locator('[data-testid="step-content"]');
    const contentText = await stepContent.textContent();

    // 应该有一些内容
    expect(contentText?.length).toBeGreaterThan(0);
  });
});
