use std::path::{Path, PathBuf};
use std::fs;
use serde::{Deserialize, Serialize};
use anyhow::{Context, Result};

// ============= 数据结构定义（与现有文件格式兼容） =============

// 课程列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseListItem {
    pub id: String,
    pub content_dir: String,
    pub status: Vec<String>,
}

// 课程列表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseList {
    pub courses: Vec<CourseListItem>,
}

// 课程信息（用于前端显示）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CourseInfo {
    pub id: String,
    pub content_dir: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logo: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub poster: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cover: Option<String>,
    pub status: Vec<String>,
}

// 课程详情（course-content.json 格式）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseDetailInternal {
    pub title: String,
    pub description: String,
    pub logo: String,
    pub poster: String,
    pub cover: String,
    #[serde(default)]
    pub container_live_time: String,
    pub chapters: Vec<ChapterInfo>,
}

// 前端使用的课程详情
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CourseDetail {
    pub title: String,
    pub description: String,
    pub logo: String,
    pub poster: String,
    pub cover: String,
    pub container_live_time: String,
    pub chapters: Vec<ChapterInfo>,
}

// 章节信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterInfo {
    pub content_dir: String,
    pub title: String,
    pub description: String,
    pub estimated_time: String,
}

// 章节详情内部格式（index.json）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterDetailInternal {
    pub title: String,
    pub description: String,
    pub details: ChapterDetails,
    pub backend: BackendInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterDetails {
    pub steps: Vec<StepInfo>,
    pub introduction: FileRef,
    pub finish: FileRef,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileRef {
    pub md_file: String,
}

// 前端使用的章节详情
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterDetail {
    pub title: String,
    pub description: String,
    pub steps: Vec<StepInfo>,
    pub estimated_time: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub introduction: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub finish: Option<String>,
    pub backend: BackendInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackendInfo {
    pub image_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepInfo {
    pub title: String,
    pub md_file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StepContent {
    pub title: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sql_commands: Option<Vec<SqlCommand>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlCommand {
    pub sql: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

// ============= 课程管理器 =============

pub struct CourseManager {
    base_path: PathBuf,
}

impl CourseManager {
    /// 创建新的课程管理器
    pub fn new() -> Result<Self> {
        // 先尝试使用项目根目录
        let mut base_path = std::env::current_dir()?;

        // 如果当前目录是 src-tauri，则返回到项目根目录
        if base_path.ends_with("src-tauri") {
            base_path = base_path.parent()
                .ok_or_else(|| anyhow::anyhow!("Cannot find parent directory"))?
                .to_path_buf();
        }

        // 添加课程路径
        base_path = base_path.join("courses/opengauss/courses");

        eprintln!("[CourseManager] Initializing with path: {:?}", base_path);
        eprintln!("[CourseManager] Path exists: {}", base_path.exists());

        Ok(CourseManager { base_path })
    }

    /// 获取所有课程列表
    pub async fn get_courses(&self) -> Result<Vec<CourseInfo>> {
        eprintln!("[CourseManager] Getting courses from: {:?}", self.base_path);

        // 读取 course-list.json
        let course_list_path = self.base_path.join("course-list.json");

        eprintln!("[CourseManager] Reading course list from: {:?}", course_list_path);
        eprintln!("[CourseManager] File exists: {}", course_list_path.exists());

        let content = fs::read_to_string(&course_list_path)
            .with_context(|| format!("Failed to read {:?}", course_list_path))?;

        eprintln!("[CourseManager] Course list content length: {} bytes", content.len());

        let course_list: CourseList = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse {:?}", course_list_path))?;

        eprintln!("[CourseManager] Found {} courses in list", course_list.courses.len());

        // 转换为 CourseInfo，并加载每个课程的 title 和 description
        let mut courses = Vec::new();
        for item in &course_list.courses {
            eprintln!("[CourseManager] Processing course: id={}, dir={:?}", item.id, item.content_dir);

            // 尝试读取课程详情文件来获取 title 和 description
            let course_content_path = self.base_path.join(&item.content_dir).join("course-content.json");

            let (title, description, logo, poster, cover) = if course_content_path.exists() {
                match fs::read_to_string(&course_content_path) {
                    Ok(content) => {
                        if let Ok(detail) = serde_json::from_str::<CourseDetailInternal>(&content) {
                            eprintln!("[CourseManager] Loaded details for {}: {}", item.content_dir, detail.title);
                            (Some(detail.title), Some(detail.description), Some(detail.logo), Some(detail.poster), Some(detail.cover))
                        } else {
                            eprintln!("[CourseManager] Failed to parse course-content.json for {}", item.content_dir);
                            (None, None, None, None, None)
                        }
                    }
                    Err(e) => {
                        eprintln!("[CourseManager] Failed to read course-content.json for {}: {}", item.content_dir, e);
                        (None, None, None, None, None)
                    }
                }
            } else {
                eprintln!("[CourseManager] course-content.json not found for {}", item.content_dir);
                (None, None, None, None, None)
            };

            courses.push(CourseInfo {
                id: item.id.clone(),
                content_dir: item.content_dir.clone(),
                title,
                description,
                logo,
                poster,
                cover,
                status: item.status.clone(),
            });
        }

        eprintln!("[CourseManager] Returning {} courses with details", courses.len());
        Ok(courses)
    }

    /// 获取课程详细信息
    pub async fn get_course_detail(&self, course_id: &str) -> Result<CourseDetail> {
        eprintln!("[CourseManager] get_course_detail called with courseId: {}", course_id);

        // 首先读取 course-list.json 来查找对应的 content_dir
        let course_list_path = self.base_path.join("course-list.json");
        let content = fs::read_to_string(&course_list_path)
            .with_context(|| format!("Failed to read {:?}", course_list_path))?;

        let course_list: CourseList = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse {:?}", course_list_path))?;

        // 根据 course_id 查找对应的 content_dir
        let mut content_dir = None;
        for item in &course_list.courses {
            if item.id == course_id {
                content_dir = Some(item.content_dir.clone());
                eprintln!("[CourseManager] Found content_dir '{}' for courseId '{}'", item.content_dir, course_id);
                break;
            }
        }

        let content_dir = content_dir.ok_or_else(|| anyhow::anyhow!("Course not found with id: {}", course_id))?;

        let course_content_path = self.base_path.join(&content_dir).join("course-content.json");

        eprintln!("[CourseManager] Reading course content from: {:?}", course_content_path);

        let content = fs::read_to_string(&course_content_path)
            .with_context(|| format!("Failed to read {:?}", course_content_path))?;

        let detail_internal: CourseDetailInternal = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse {:?}", course_content_path))?;

        // 转换为前端格式
        let detail = CourseDetail {
            title: detail_internal.title,
            description: detail_internal.description,
            logo: detail_internal.logo,
            poster: detail_internal.poster,
            cover: detail_internal.cover,
            container_live_time: detail_internal.container_live_time,
            chapters: detail_internal.chapters,
        };

        Ok(detail)
    }

    /// 获取章节详细信息
    pub async fn get_chapter_detail(&self, course_id: &str, chapter_dir: &str) -> Result<ChapterDetail> {
        eprintln!("[CourseManager] get_chapter_detail called with courseId: {}, chapterDir: {}", course_id, chapter_dir);

        // 根据 course_id 查找对应的 content_dir
        let course_list_path = self.base_path.join("course-list.json");
        let content = fs::read_to_string(&course_list_path)
            .with_context(|| format!("Failed to read {:?}", course_list_path))?;

        let course_list: CourseList = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse {:?}", course_list_path))?;

        // 查找对应的 content_dir
        let mut content_dir_from_id = None;
        for item in &course_list.courses {
            if item.id == course_id {
                content_dir_from_id = Some(item.content_dir.clone());
                eprintln!("[CourseManager] Found content_dir '{}' for courseId '{}'", item.content_dir, course_id);
                break;
            }
        }

        let content_dir_from_id = content_dir_from_id.ok_or_else(|| anyhow::anyhow!("Course not found with id: {}", course_id))?;

        // 使用找到的 content_dir 和传入的 chapter_dir 构建路径
        let chapter_json_path = self.base_path.join(&content_dir_from_id).join(chapter_dir).join("index.json");

        eprintln!("[CourseManager] Reading chapter from: {:?}", chapter_json_path);

        let content = fs::read_to_string(&chapter_json_path)
            .with_context(|| format!("Failed to read {:?}", chapter_json_path))?;

        let detail_internal: ChapterDetailInternal = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse {:?}", chapter_json_path))?;

        // 读取 estimated_time（从 details 中没有这个字段，需要从其他地方获取）
        // 暂时使用一个默认值
        let estimated_time = "20 min".to_string();

        // 转换为前端格式
        let detail = ChapterDetail {
            title: detail_internal.title,
            description: detail_internal.description,
            steps: detail_internal.details.steps,
            estimated_time,
            introduction: Some(detail_internal.details.introduction.md_file),
            finish: Some(detail_internal.details.finish.md_file),
            backend: detail_internal.backend,
        };

        Ok(detail)
    }

    /// 获取步骤内容
    pub async fn get_step_content(&self, course_id: &str, chapter_dir: &str, step_file: &str) -> Result<StepContent> {
        eprintln!("[CourseManager] get_step_content called with courseId: {}, chapterDir: {}, stepFile: {}",
            course_id, chapter_dir, step_file);

        // 根据 course_id 查找对应的 content_dir
        let course_list_path = self.base_path.join("course-list.json");
        let content = fs::read_to_string(&course_list_path)
            .with_context(|| format!("Failed to read {:?}", course_list_path))?;

        let course_list: CourseList = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse {:?}", course_list_path))?;

        // 查找对应的 content_dir
        let mut content_dir_from_id = None;
        for item in &course_list.courses {
            if item.id == course_id {
                content_dir_from_id = Some(item.content_dir.clone());
                eprintln!("[CourseManager] Found content_dir '{}' for courseId '{}'", item.content_dir, course_id);
                break;
            }
        }

        let content_dir_from_id = content_dir_from_id.ok_or_else(|| anyhow::anyhow!("Course not found with id: {}", course_id))?;

        // 使用找到的 content_dir 和传入的 chapter_dir 构建路径
        let step_path = self.base_path
            .join(&content_dir_from_id)
            .join(chapter_dir)
            .join(step_file);

        eprintln!("[CourseManager] Reading step from: {:?}", step_path);

        let markdown_content = fs::read_to_string(&step_path)
            .with_context(|| format!("Failed to read {:?}", step_path))?;

        // 解析 markdown 内容
        let step_content = self.parse_markdown_step(&markdown_content, step_file)?;

        Ok(step_content)
    }

    /// 解析 markdown 步骤内容
    fn parse_markdown_step(&self, content: &str, step_file: &str) -> Result<StepContent> {
        let lines: Vec<&str> = content.lines().collect();
        let mut title = String::new();
        let mut content_text = String::new();
        let mut sql_commands = Vec::new();
        let mut in_code_block = false;
        let mut code_block_lang = String::new();
        let mut code_block_content = String::new();

        // 提取标题（第一个 # 或 ## 标题）
        for line in &lines {
            let trimmed = line.trim();
            if trimmed.starts_with("### ") {
                title = trimmed[3..].trim().to_string();
                break;
            } else if trimmed.starts_with("## ") {
                title = trimmed[2..].trim().to_string();
                break;
            } else if trimmed.starts_with("# ") {
                title = trimmed[1..].trim().to_string();
                break;
            }
        }

        if title.is_empty() {
            title = format!("Step: {}", step_file);
        }

        // 解析代码块
        for i in 0..lines.len() {
            let line = lines[i];

            if line.trim().starts_with("```") {
                if !in_code_block {
                    // 代码块开始
                    in_code_block = true;
                    code_block_lang = line.trim()[3..].trim().to_string();
                    code_block_content = String::new();
                } else {
                    // 代码块结束
                    in_code_block = false;

                    // 如果是 SQL 代码块，提取为 SQL 命令
                    if code_block_lang.to_lowercase() == "sql" || code_block_lang.is_empty() {
                        // 尝试从前面的行找到描述
                        let description = self.extract_code_block_description(&lines, i);

                        sql_commands.push(SqlCommand {
                            sql: code_block_content.trim().to_string(),
                            description,
                        });
                    }

                    code_block_lang = String::new();
                    code_block_content = String::new();
                }
            } else if in_code_block {
                code_block_content.push_str(line);
                code_block_content.push('\n');
            }
        }

        content_text = content.to_string();

        Ok(StepContent {
            title,
            content: content_text,
            sql_commands: if sql_commands.is_empty() { None } else { Some(sql_commands) },
        })
    }

    /// 从代码块前面的行提取描述
    fn extract_code_block_description(&self, lines: &[&str], code_end_index: usize) -> Option<String> {
        // 向前查找最近的描述（非空行）
        let mut description = String::new();
        let mut found_desc = false;

        for i in (0..code_end_index).rev() {
            let line = lines[i].trim();

            // 跳过代码块开始标记
            if line.starts_with("```") {
                break;
            }

            // 跳过空行
            if line.is_empty() {
                continue;
            }

            // 如果找到描述行，收集它
            if !found_desc {
                found_desc = true;
            }

            // 简单取最近的非空行作为描述
            if description.is_empty() {
                description = line.to_string();
                break;
            }
        }

        if description.is_empty() {
            None
        } else {
            Some(description)
        }
    }
}
