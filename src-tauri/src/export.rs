use rust_xlsxwriter::*;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcelColumn {
    pub header: String,
    pub field: String,
    pub width: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcelSheetData {
    pub name: String,
    pub columns: Vec<ExcelColumn>,
    pub rows: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcelExportData {
    pub sheets: Vec<ExcelSheetData>,
    pub file_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TxtExportData {
    pub content: String,
    pub file_name: Option<String>,
}

#[tauri::command]
pub async fn export_to_excel(data: ExcelExportData) -> Result<String, String> {
    let file_dialog = rfd::FileDialog::new()
        .set_title("保存 Excel 文件")
        .add_filter("Excel 文件", &["xlsx"])
        .set_file_name(&data.file_name.unwrap_or_else(|| "export.xlsx".to_string()));

    let file_path = if let Some(path) = file_dialog.save_file() {
        path
    } else {
        return Err("用户取消了保存".to_string());
    };

    let mut workbook = Workbook::new();

    for (sheet_idx, sheet_data) in data.sheets.iter().enumerate() {
        let worksheet = workbook.add_worksheet().set_name(&sheet_data.name).map_err(|e| e.to_string())?;

        for (col_idx, column) in sheet_data.columns.iter().enumerate() {
            worksheet.write_string(0, col_idx as u16, &column.header).map_err(|e| e.to_string())?;
            
            if let Some(width) = column.width {
                worksheet.set_column_width(col_idx as u16, width).map_err(|e| e.to_string())?;
            }
        }

        for (row_idx, row) in sheet_data.rows.iter().enumerate() {
            for (col_idx, column) in sheet_data.columns.iter().enumerate() {
                let cell_value = row.get(&column.field);
                let row_num = (row_idx + 1) as u32;
                let col_num = col_idx as u16;

                if let Some(value) = cell_value {
                    if value.is_string() {
                        worksheet.write_string(row_num, col_num, value.as_str().unwrap()).map_err(|e| e.to_string())?;
                    } else if value.is_number() {
                        if value.is_i64() {
                            worksheet.write_number(row_num, col_num, value.as_i64().unwrap() as f64).map_err(|e| e.to_string())?;
                        } else if value.is_f64() {
                            worksheet.write_number(row_num, col_num, value.as_f64().unwrap()).map_err(|e| e.to_string())?;
                        }
                    } else if value.is_boolean() {
                        worksheet.write_boolean(row_num, col_num, value.as_bool().unwrap()).map_err(|e| e.to_string())?;
                    } else {
                        worksheet.write_string(row_num, col_num, &value.to_string()).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }

    workbook.save(&file_path).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn export_to_txt(data: TxtExportData) -> Result<String, String> {
    let file_dialog = rfd::FileDialog::new()
        .set_title("保存 TXT 文件")
        .add_filter("文本文件", &["txt"])
        .set_file_name(&data.file_name.unwrap_or_else(|| "export.txt".to_string()));

    let file_path = if let Some(path) = file_dialog.save_file() {
        path
    } else {
        return Err("用户取消了保存".to_string());
    };

    let mut file = File::create(&file_path).map_err(|e| e.to_string())?;
    file.write_all(data.content.as_bytes()).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}
