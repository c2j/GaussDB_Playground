use std::path::{Path, PathBuf};
use std::fs;
use serde::{Deserialize, Serialize};
use anyhow::{Context, Result};

// 专业信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MajorInfo {
    pub id: String,
    pub name: String,
    pub path: String,
}

// ============= 数据结构定义（与现有文件格式兼容） =============

// 课程列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseListItem {
    pub id: String,
    pub content_dir: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_intro: Option<String>,
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
    majors_base_path: PathBuf,
    current_major: Option<String>,
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

        // 添加课程基础路径（courses 目录）
        base_path = base_path.join("courses");

        eprintln!("[CourseManager] Initializing with majors path: {:?}", base_path);
        eprintln!("[CourseManager] Path exists: {}", base_path.exists());

        // 默认选择第一个可用的专业目录
        let current_major = Self::scan_available_majors(&base_path)?
            .first()
            .map(|m| m.id.clone());

        eprintln!("[CourseManager] Default major: {:?}", current_major);

        Ok(CourseManager { majors_base_path: base_path, current_major })
    }

    /// 获取所有可用的专业目录
    pub fn get_available_majors(&self) -> Result<Vec<MajorInfo>> {
        Self::scan_available_majors(&self.majors_base_path)
    }

    /// 静态方法：从指定基础路径扫描所有专业目录
    fn scan_available_majors(base_path: &Path) -> Result<Vec<MajorInfo>> {
        let mut majors = Vec::new();

        eprintln!("[CourseManager] Scanning for majors in: {:?}", base_path);

        if !base_path.exists() {
            eprintln!("[CourseManager] Warning: courses directory does not exist");
            return Ok(majors);
        }

        let entries = fs::read_dir(base_path)
            .with_context(|| format!("Failed to read directory: {:?}", base_path))?;

        for entry in entries {
            let entry = entry.with_context(|| format!("Failed to read entry"))?;
            let path = entry.path();

            // 只处理目录
            if path.is_dir() {
                // 跳过隐藏目录
                if let Some(name) = path.file_name() {
                    let name_str = name.to_string_lossy();
                    if name_str.starts_with('.') {
                        continue;
                    }

                    // 检查是否存在 courses 子目录
                    let courses_subdir = path.join("courses");
                    if courses_subdir.exists() {
                        majors.push(MajorInfo {
                            id: name_str.to_string(),
                            name: Self::format_major_name(&name_str),
                            path: name_str.to_string(),
                        });
                        eprintln!("[CourseManager] Found major: {} at {:?}", name_str, courses_subdir);
                    }
                }
            }
        }

        // 按名称排序
        majors.sort_by(|a, b| a.name.cmp(&b.name));

        eprintln!("[CourseManager] Found {} majors", majors.len());
        Ok(majors)
    }

    /// 格式化专业名称（将 kebab-case 转换为 Title Case）
    fn format_major_name(id: &str) -> String {
        id.split('-')
            .map(|s| {
                let mut chars = s.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().chain(chars).collect::<String>(),
                }
            })
            .collect::<Vec<String>>()
            .join(" ")
    }

    /// 设置当前专业目录
    pub fn set_current_major(&mut self, major_id: String) -> Result<()> {
        // 验证专业目录是否存在
        let major_path = self.majors_base_path.join(&major_id).join("courses");
        if !major_path.exists() {
            return Err(anyhow::anyhow!("Major directory not found: {:?}", major_path));
        }

        self.current_major = Some(major_id);
        eprintln!("[CourseManager] Set current major to: {:?}", self.current_major);
        Ok(())
    }

    /// 获取当前基础路径
    fn get_current_base_path(&self) -> Result<PathBuf> {
        let major_id = self.current_major.as_ref()
            .ok_or_else(|| anyhow::anyhow!("No major selected"))?;

        let path = self.majors_base_path.join(major_id).join("courses");
        eprintln!("[CourseManager] Current base path: {:?}", path);
        Ok(path)
    }

    /// 获取所有课程列表
    pub async fn get_courses(&self) -> Result<Vec<CourseInfo>> {
        let base_path = self.get_current_base_path()?;
        eprintln!("[CourseManager] Getting courses from: {:?}", base_path);

        // 读取 course-list.json
        let course_list_path = base_path.join("course-list.json");

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
            let course_content_path = base_path.join(&item.content_dir).join("course-content.json");

            // 如果在子目录中找不到，尝试在父目录中查找（针对 mgca 这种结构）
            let fallback_course_content_path = if item.content_dir == "." {
                base_path.parent().and_then(|p| Some(p.join("course-content.json")))
            } else {
                None
            };

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
            } else if let Some(fallback_path) = fallback_course_content_path {
                if fallback_path.exists() {
                    match fs::read_to_string(&fallback_path) {
                        Ok(content) => {
                            if let Ok(detail) = serde_json::from_str::<CourseDetailInternal>(&content) {
                                eprintln!("[CourseManager] Loaded details from fallback for {}: {}", item.content_dir, detail.title);
                                (Some(detail.title), Some(detail.description), Some(detail.logo), Some(detail.poster), Some(detail.cover))
                            } else {
                                eprintln!("[CourseManager] Failed to parse fallback course-content.json for {}", item.content_dir);
                                (None, None, None, None, None)
                            }
                        }
                        Err(e) => {
                            eprintln!("[CourseManager] Failed to read fallback course-content.json for {}: {}", item.content_dir, e);
                            (None, None, None, None, None)
                        }
                    }
                } else {
                    eprintln!("[CourseManager] course-content.json not found for {} (fallback)", item.content_dir);
                    (None, None, None, None, None)
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

        let base_path = self.get_current_base_path()?;

        // 首先读取 course-list.json 来查找对应的 content_dir
        let course_list_path = base_path.join("course-list.json");
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

        let course_content_path = base_path.join(&content_dir).join("course-content.json");

        eprintln!("[CourseManager] Reading course content from: {:?}", course_content_path);

        // 如果在子目录中找不到，尝试在父目录中查找
        let course_content_path = if !course_content_path.exists() && content_dir == "." {
            if let Some(parent) = base_path.parent() {
                let fallback_path = parent.join("course-content.json");
                eprintln!("[CourseManager] Trying fallback path: {:?}", fallback_path);
                fallback_path
            } else {
                course_content_path
            }
        } else {
            course_content_path
        };

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

        let base_path = self.get_current_base_path()?;

        // 根据 course_id 查找对应的 content_dir
        let course_list_path = base_path.join("course-list.json");
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
        // 如果 content_dir_from_id 是 "."，直接使用 base_path（跳过 join）
        let chapter_json_path = if content_dir_from_id == "." {
            base_path.join(chapter_dir).join("index.json")
        } else {
            base_path.join(&content_dir_from_id).join(chapter_dir).join("index.json")
        };

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

        let base_path = self.get_current_base_path()?;

        // 根据 course_id 查找对应的 content_dir
        let course_list_path = base_path.join("course-list.json");
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
        // 如果 content_dir_from_id 是 "."，直接使用 base_path（跳过 join）
        let step_path = if content_dir_from_id == "." {
            base_path
                .join(chapter_dir)
                .join(step_file)
        } else {
            base_path
                .join(&content_dir_from_id)
                .join(chapter_dir)
                .join(step_file)
        };

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

        Ok(StepContent {
            title,
            content: content.to_string(),
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

    /// 获取课程介绍
    pub async fn get_course_introduction(&self, course_id: &str) -> Result<StepContent> {
        eprintln!("[CourseManager] get_course_introduction called with courseId: {}", course_id);

        let base_path = self.get_current_base_path()?;

        // 根据 course_id 查找对应的 content_dir
        let course_list_path = base_path.join("course-list.json");
        let content = fs::read_to_string(&course_list_path)
            .with_context(|| format!("Failed to read {:?}", course_list_path))?;

        let course_list: CourseList = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse {:?}", course_list_path))?;

        // 根据 course_id 查找对应的课程项
        let mut course_item = None;
        for item in &course_list.courses {
            if item.id == course_id {
                course_item = Some(item.clone());
                eprintln!("[CourseManager] Found course item: {} - {:?}", item.id, item.content_dir);
                break;
            }
        }

        let course_item = course_item.ok_or_else(|| anyhow::anyhow!("Course not found with id: {}", course_id))?;

        // 从 course-list.json 中读取 content_intro 字段
        let intro_file = course_item.content_intro.clone().unwrap_or_else(|| {
            // 如果 content_intro 不存在，使用旧的逻辑
            eprintln!("[CourseManager] No content_intro field, using fallback logic");
            if course_item.content_dir == "." {
                format!("{}-intro.md", course_id)
            } else {
                format!("{}/intro.md", course_item.content_dir)
            }
        });

        // 构建介绍文件的完整路径
        let intro_path = base_path.join(&intro_file);

        eprintln!("[CourseManager] Looking for intro at: {:?}", intro_path);

        if !intro_path.exists() {
            // 如果找不到，返回一个默认的介绍内容
            eprintln!("[CourseManager] Intro file not found, returning default content");
            return Ok(StepContent {
                title: format!("课程介绍 - {}", course_id),
                content: format!("课程 {} 的介绍内容正在开发中...", course_id),
                sql_commands: None,
            });
        }

        let markdown_content = fs::read_to_string(&intro_path)
            .with_context(|| format!("Failed to read {:?}", intro_path))?;

        eprintln!("[CourseManager] Loaded intro content, length: {} bytes", markdown_content.len());

        // 简单的 Markdown 内容
        Ok(StepContent {
            title: format!("课程介绍 - {}", course_id),
            content: markdown_content,
            sql_commands: None,
        })
    }
}
