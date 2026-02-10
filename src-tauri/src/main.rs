// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod courses;

use database::{DbConfig, ConnectionStatus, QueryResult, TableInfo, DatabaseManager};
use courses::{CourseManager, CourseInfo, CourseDetail, ChapterDetail, StepContent, MajorInfo};
use std::sync::Mutex;
use tokio::sync::Mutex as TokioMutex;

// Application state
struct AppState {
    db_manager: Mutex<DatabaseManager>,
    course_manager: TokioMutex<CourseManager>,
}

#[tauri::command]
async fn test_connection(config: DbConfig) -> Result<ConnectionStatus, String> {
    let manager = DatabaseManager::new()
        .map_err(|e| format!("Failed to create database manager: {}", e))?;

    manager
        .test_connection(&config)
        .await
        .map_err(|e| format!("Connection test failed: {}", e))
}

#[tauri::command]
async fn execute_query(config: DbConfig, sql: String) -> Result<QueryResult, String> {
    let manager = DatabaseManager::new()
        .map_err(|e| format!("Failed to create database manager: {}", e))?;

    manager
        .execute_query(&config, &sql)
        .await
        .map_err(|e| format!("Query execution failed: {}", e))
}

#[tauri::command]
async fn get_schema_info(config: DbConfig) -> Result<Vec<TableInfo>, String> {
    let manager = DatabaseManager::new()
        .map_err(|e| format!("Failed to create database manager: {}", e))?;

    manager
        .get_schema_info(&config)
        .await
        .map_err(|e| format!("Failed to get schema info: {}", e))
}

#[tauri::command]
fn save_config(config: DbConfig) -> Result<(), String> {
    let manager = DatabaseManager::new()
        .map_err(|e| format!("Failed to create database manager: {}", e))?;

    manager
        .save_config(&config)
        .map_err(|e| format!("Failed to save config: {}", e))?;

    Ok(())
}

#[tauri::command]
fn load_config() -> Result<Option<DbConfig>, String> {
    let manager = DatabaseManager::new()
        .map_err(|e| format!("Failed to create database manager: {}", e))?;

    manager
        .load_config()
        .map_err(|e| format!("Failed to load config: {}", e))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

// ============= 课程相关命令 =============

#[tauri::command]
async fn get_courses(state: tauri::State<'_, AppState>) -> Result<Vec<CourseInfo>, String> {
    eprintln!("[Tauri Command] get_courses called");
    let manager = state.course_manager.lock().await;

    let result = manager.get_courses().await
        .map_err(|e| format!("Failed to get courses: {}", e))?;

    eprintln!("[Tauri Command] get_courses returning {} courses", result.len());
    Ok(result)
}

#[tauri::command]
async fn get_course_detail(state: tauri::State<'_, AppState>, course_id: String) -> Result<CourseDetail, String> {
    eprintln!("[Tauri Command] get_course_detail called with courseId: {}", course_id);
    let manager = state.course_manager.lock().await;

    let result = manager.get_course_detail(&course_id).await
        .map_err(|e| format!("Failed to get course detail: {}", e))?;

    eprintln!("[Tauri Command] get_course_detail returning course: {}", result.title);
    Ok(result)
}

#[tauri::command]
async fn get_chapter_detail(
    state: tauri::State<'_, AppState>,
    course_id: String,
    chapter_dir: String
) -> Result<ChapterDetail, String> {
    eprintln!("[Tauri Command] get_chapter_detail called with courseId: {}, chapterDir: {}", course_id, chapter_dir);
    let manager = state.course_manager.lock().await;

    let result = manager.get_chapter_detail(&course_id, &chapter_dir).await
        .map_err(|e| format!("Failed to get chapter detail: {}", e))?;

    eprintln!("[Tauri Command] get_chapter_detail returning chapter: {}", result.title);
    Ok(result)
}

#[tauri::command]
async fn get_course_introduction(
    state: tauri::State<'_, AppState>,
    course_id: String
) -> Result<StepContent, String> {
    eprintln!("[Tauri Command] get_course_introduction called with courseId: {}", course_id);
    let manager = state.course_manager.lock().await;

    let result = manager.get_course_introduction(&course_id).await
        .map_err(|e| format!("Failed to get course introduction: {}", e))?;

    eprintln!("[Tauri Command] get_course_introduction returning content with title: {}", result.title);
    Ok(result)
}

#[tauri::command]
async fn get_step_content(
    state: tauri::State<'_, AppState>,
    course_id: String,
    chapter_dir: String,
    step_file: String
) -> Result<StepContent, String> {
    eprintln!("[Tauri Command] get_step_content called with courseId: {}, chapterDir: {}, stepFile: {}",
        course_id, chapter_dir, step_file);
    let manager = state.course_manager.lock().await;

    let result = manager.get_step_content(&course_id, &chapter_dir, &step_file).await
        .map_err(|e| format!("Failed to get step content: {}", e))?;

    eprintln!("[Tauri Command] get_step_content returning content with title: {}", result.title);
    Ok(result)
}

#[tauri::command]
async fn get_majors(state: tauri::State<'_, AppState>) -> Result<Vec<MajorInfo>, String> {
    eprintln!("[Tauri Command] get_majors called");
    let manager = state.course_manager.lock().await;

    let result = manager.get_available_majors()
        .map_err(|e| format!("Failed to get majors: {}", e))?;

    eprintln!("[Tauri Command] get_majors returning {} majors", result.len());
    Ok(result)
}

#[tauri::command]
async fn set_current_major(state: tauri::State<'_, AppState>, major_id: String) -> Result<(), String> {
    eprintln!("[Tauri Command] set_current_major called with majorId: {}", major_id);
    let mut manager = state.course_manager.lock().await;

    manager.set_current_major(major_id)
        .map_err(|e| format!("Failed to set current major: {}", e))?;

    eprintln!("[Tauri Command] set_current_major succeeded");
    Ok(())
}

fn main() {
    let db_manager = DatabaseManager::new()
        .expect("Failed to create DatabaseManager");

    let course_manager = CourseManager::new()
        .expect("Failed to create CourseManager");

    tauri::Builder::default()
        .manage(AppState {
            db_manager: Mutex::new(db_manager),
            course_manager: TokioMutex::new(course_manager),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            // Database commands
            test_connection,
            execute_query,
            get_schema_info,
            save_config,
            load_config,
            // Course commands
            get_courses,
            get_course_detail,
            get_course_introduction,
            get_chapter_detail,
            get_step_content,
            get_majors,
            set_current_major,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
