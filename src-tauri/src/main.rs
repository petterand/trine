// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn set_dock_badge(badge: Option<String>) {
    #[cfg(target_os = "macos")]
    {
        // On macOS, sets the dock tile badge label ("1", "9+", or clears if None)
        println!("macOS dock badge: {:?}", badge);
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![set_dock_badge])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
