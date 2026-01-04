use tauri::Manager;
use tauri::command;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct GreetingRequest {
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct SystemInfo {
    pub platform: String,
    pub arch: String,
}

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[command]
fn get_app_info() -> AppInfo {
    AppInfo {
        name: "BioDockify AI".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        description: "AI-Powered Pharmaceutical Research Platform".to_string(),
    }
}

#[command]
fn get_system_info() -> SystemInfo {
    SystemInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    }
}

#[command]
fn open_url(url: String) -> Result<(), String> {
    tauri::api::shell::open(&url, None::<&str>(None))
        .map_err(|e| e.to_string())
}

#[command]
fn open_file(path: PathBuf) -> Result<(), String> {
    tauri::api::shell::open(
        &path.to_string_lossy().to_string(),
        None::<&str>(None),
    )
    .map_err(|e| e.to_string())
}

#[command]
fn show_in_folder(path: PathBuf) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let command = "explorer";
    
    #[cfg(not(target_os = "windows"))]
    let command = "open";
    
    if let Some(parent) = path.parent() {
        let folder = parent.to_string_lossy().to_string();
        tauri::api::shell::open(&folder, None::<&str>(None))
            .map_err(|e| e.to_string())
    } else {
        Err("Path has no parent folder".to_string())
    }
}

#[command]
fn minimize_window() {
    #[cfg(not(target_os = "macos"))]
    tauri::Manager::app_handle()
        .get_window("main")
        .unwrap()
        .minimize()
        .expect("Failed to minimize window");
}

#[command]
fn maximize_window() {
    #[cfg(not(target_os = "macos"))]
    tauri::Manager::app_handle()
        .get_window("main")
        .unwrap()
        .maximize()
        .expect("Failed to maximize window");
}

#[command]
fn close_window() {
    tauri::Manager::app_handle()
        .get_window("main")
        .unwrap()
        .close()
        .expect("Failed to close window");
}

#[command]
fn toggle_fullscreen(_window: tauri::Window) {
    _window.set_fullscreen(!_window.is_fullscreen().unwrap_or(false))
        .expect("Failed to toggle fullscreen");
}

#[command]
fn is_dev() -> bool {
    cfg!(debug_assertions)
}

#[command]
fn get_config_path() -> Result<String, String> {
    tauri::api::path::resolve(
        "../config.yaml",
        Some(tauri::BaseDirectory::Resource),
    )
    .map(|p| p.to_string_lossy().to_string())
    .map_err(|e| e.to_string())
}

fn lib() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_info,
            get_system_info,
            open_url,
            open_file,
            show_in_folder,
            minimize_window,
            maximize_window,
            close_window,
            toggle_fullscreen,
            is_dev,
            get_config_path,
        ])
        .run(tauri::generate_context!())
}
