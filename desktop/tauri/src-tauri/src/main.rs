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
            
            // Spawn the Agent Zero Backend Sidecar (Auto-Restart Monitor)
            tauri::async_runtime::spawn(async move {
                loop {
                    println!("[BioDockify Host] Spawning Backend Sidecar...");
                    let (mut rx, mut child) = match Command::new_sidecar("biodockify-engine")
                        .expect("failed to create sidecar configuration")
                        .spawn() {
                            Ok(res) => res,
                            Err(e) => {
                                eprintln!("[BioDockify Host] Failed to spawn sidecar: {}", e);
                                std::thread::sleep(std::time::Duration::from_secs(5));
                                continue;
                            }
                        };

                    println!("[BioDockify Host] Backend started. Monitoring...");

                    // Monitor sidecar events
                    while let Some(event) = rx.recv().await {
                       if let CommandEvent::Stdout(line) = event {
                           println!("[AGENT ZERO]: {}", line);
                       }
                       // If process exits, the channel might close or sending a specific event?
                       // CommandEvent doesn't explicitly have "Exit" in simple mode, 
                       // but rx.recv() returns None when channel closes (process dies).
                    }
                    
                    println!("[BioDockify Host] Sidecar exited unexpectedly. Restarting in 2s...");
                    std::thread::sleep(std::time::Duration::from_secs(2));
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
