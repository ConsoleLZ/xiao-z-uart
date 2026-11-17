mod uart;
mod export;
use std::sync::{Arc, Mutex};
use tauri::Manager;

pub fn run() {
    let serial_state = Arc::new(Mutex::new(uart::SerialState::new()));

    tauri::Builder::default()
        .manage(serial_state)
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let base_name = "小z串口调试助手";
                
                // 使用编译时特性
                let final_title = if cfg!(feature = "beta") {
                    // Beta 版本
                    format!("{} - 测试版", base_name)
                } else if cfg!(debug_assertions) {
                    // Debug 版本
                    format!("{} - debug包", base_name)
                } else {
                    // Release 版本
                    base_name.to_string()
                };
                
                window.set_title(&final_title).unwrap_or_else(|err| {
                    eprintln!("设置窗口标题失败: {}", err);
                });
                
                println!("应用标题设置为: {}", final_title);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            uart::list_ports,
            uart::open_port,
            uart::send_data,
            uart::close_port,
            uart::set_frame_config,
            export::export_to_excel,
            export::export_to_txt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}