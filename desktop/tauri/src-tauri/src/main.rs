#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent, CustomMenuItem};
use tauri::api::process::{Command, CommandEvent};

fn main() {
    // Defines the system tray menu
    let quit = CustomMenuItem::new("quit".to_string(), "Quit BioDockify");
    let show = CustomMenuItem::new("show".to_string(), "Show Dashboard");
    let pause = CustomMenuItem::new("pause".to_string(), "Pause Research").disabled(); // Future implementation
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(pause)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
        
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec![])))
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        let window = app.get_window("main").unwrap();
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // Spawn the Agent Zero Backend Sidecar
            tauri::async_runtime::spawn(async move {
                let (mut rx, mut child) = Command::new_sidecar("biodockify-engine")
                    .expect("failed to create sidecar configuration")
                    .spawn()
                    .expect("failed to spawn sidecar");

                // Monitor sidecar events (optional, for debug)
                while let Some(event) = rx.recv().await {
                   if let CommandEvent::Stdout(line) = event {
                       println!("[AGENT ZERO]: {}", line);
                   }
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
