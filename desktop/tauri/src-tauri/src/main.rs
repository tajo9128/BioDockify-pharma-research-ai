#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri::api::process::{Command, CommandEvent};

fn main() {
    tauri::Builder::default()
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
                       // We could emit this to frontend if needed
                       // window.emit("backend-log", line).unwrap();
                   }
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
