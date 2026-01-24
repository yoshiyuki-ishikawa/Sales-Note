use tauri::Manager;

#[tauri::command]
async fn backup_database(app: tauri::AppHandle) -> Result<String, String> {
  use std::fs;

  // 1. Get App Data Dir (e.g., AppData/Roaming/com.tauri.dev)
  let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  let db_path = app_dir.join("sales.db");

  // 2. Define Backup Dir (Documents/SalesNoteBackups)
  let doc_dir = app.path().document_dir().map_err(|e| e.to_string())?;
  let backup_dir = doc_dir.join("SalesNoteBackups");

  if !backup_dir.exists() {
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
  }

  // 3. Create Backup Filename with Timestamp
  let now = chrono::Local::now();
  let filename = format!("sales_backup_{}.db", now.format("%Y%m%d_%H%M%S"));
  let backup_path = backup_dir.join(&filename);

  // 4. Copy File
  if db_path.exists() {
    fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;
    Ok(now.format("%H:%M").to_string())
  } else {
    Err("Database file not found".to_string())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![backup_database])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .plugin(tauri_plugin_shell::init())
    .plugin(
        tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sales.db", vec![
            tauri_plugin_sql::Migration {
            version: 1,
            description: "create sales table",
            sql: include_str!("../migrations/1_init.sql"),
            kind: tauri_plugin_sql::MigrationKind::Up,
            }
        ])
        .build(),
    )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
