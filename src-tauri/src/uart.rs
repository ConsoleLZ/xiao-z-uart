use serde::Deserialize;
use serde::Serialize;
use serialport::{available_ports, Parity, SerialPort};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::{Emitter, State};
use tokio::time::{sleep, Duration};

// ===== 帧类型枚举 =====
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum FrameType {
    HighBefore, // 大端（高位在前）
    LowBefore,  // 小端（低位在前）
}

// ===== 帧配置项 =====
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FrameConfigItem {
    #[serde(deserialize_with = "deserialize_hex_vec")]
    pub header: Vec<u8>,
    pub data_length: usize,
    #[serde(rename = "type")]
    pub frame_type: FrameType,
}

// 辅助函数：将 ["0xFC", "0xF9"] 转为 [0xFC, 0xF9]
fn deserialize_hex_vec<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let strs: Vec<String> = Vec::deserialize(deserializer)?;
    let mut bytes = Vec::with_capacity(strs.len());
    for s in strs {
        let trimmed = s.trim_start_matches("0x").trim_start_matches("0X");
        let byte = u8::from_str_radix(trimmed, 16).map_err(serde::de::Error::custom)?;
        bytes.push(byte);
    }
    Ok(bytes)
}

// ===== 串口数据输入格式 =====
#[derive(Deserialize)]
#[serde(untagged)]
pub enum SerialData {
    String(String),
    Bytes(Vec<u8>),
}

// ===== 串口状态 =====
pub struct SerialState {
    pub port: Option<Box<dyn SerialPort>>,
    pub is_reading: AtomicBool,
    pub last_ports: Mutex<Vec<String>>,
    pub buffer: Mutex<Vec<u8>>,
    pub frame_configs: Mutex<Option<Vec<FrameConfigItem>>>,
}

impl SerialState {
    pub fn new() -> Self {
        SerialState {
            port: None,
            is_reading: AtomicBool::new(false),
            last_ports: Mutex::new(Vec::new()),
            buffer: Mutex::new(Vec::new()),
            frame_configs: Mutex::new(None),
        }
    }
}

// ===== 工具函数：计算十进制值 =====
fn compute_decimal_value(payload: &[u8], frame_type: &FrameType) -> u64 {
    if payload.is_empty() || payload.len() > 8 {
        return 0;
    }

    let mut bytes = [0u8; 8];
    
    match frame_type {
        FrameType::HighBefore => {
            // 大端：高位在前，左对齐，高位补零？不！应该右对齐（高位在前，所以前面是高字节）
            // 实际上：[A B] 表示 A 是高字节，B 是低字节 → 应放在 u64 的高地址？不对。
            // 正确理解：payload 已经是按传输顺序排列的字节流。
            // 对于大端：payload[0] 是最高有效字节 → 应放在 u64 的最高字节位置（即 bytes[0]）
            bytes[8 - payload.len()..].copy_from_slice(payload);
            u64::from_be_bytes(bytes)
        }
        FrameType::LowBefore => {
            // 小端：payload[0] 是最低有效字节 → 应放在 u64 的最低字节位置（即 bytes[0]）
            bytes[..payload.len()].copy_from_slice(payload);
            u64::from_le_bytes(bytes)
        }
    }
}

// ===== 帧解析与事件发射 =====
async fn parse_frames_and_emit(
    raw_buffer: &mut Vec<u8>,
    configs: Option<Vec<FrameConfigItem>>,
    app_handle: &tauri::AppHandle,
) {
    if let Some(config_list) = configs {
        let mut consumed = 0;
        let buffer_len = raw_buffer.len();
        let mut results = Vec::new();

        'outer: while consumed < buffer_len {
            let remaining = buffer_len - consumed;

            for cfg in &config_list {
                let total_len = cfg.header.len() + cfg.data_length;
                if remaining < total_len {
                    continue;
                }

                if raw_buffer[consumed..consumed + cfg.header.len()] == cfg.header[..] {
                    let payload_start = consumed + cfg.header.len();
                    let payload = &raw_buffer[payload_start..payload_start + cfg.data_length];

                    let decimal_value = compute_decimal_value(payload, &cfg.frame_type);

                    results.push(serde_json::json!({
                        "header": cfg.header,
                        "payload": payload,
                        "decimalValue": decimal_value,
                        "frameType": match cfg.frame_type {
                            FrameType::HighBefore => "HIGH_BEFORE",
                            FrameType::LowBefore => "LOW_BEFORE",
                        },
                        "dataLength": cfg.data_length,
                    }));

                    consumed += total_len;
                    continue 'outer;
                }
            }

            // 检查是否有帧头匹配但数据不够 → 停止解析，保留半帧
            for cfg in &config_list {
                let total_len = cfg.header.len() + cfg.data_length;
                if remaining < total_len
                    && remaining >= cfg.header.len()
                    && raw_buffer[consumed..consumed + cfg.header.len()] == cfg.header[..]
                {
                    break 'outer;
                }
            }

            // 未匹配任何帧头：跳过一个字节
            consumed += 1;
        }

        // 批量 emit
        for result in results {
            let _ = app_handle.emit_to("main", "serial_data", result);
        }

        // 移除已消费的字节
        if consumed > 0 {
            raw_buffer.drain(..consumed);
        }

        // 保留最多 max_frame_len - 1 字节，用于下次拼接半帧
        let max_frame_len = config_list
            .iter()
            .map(|c| c.header.len() + c.data_length)
            .max()
            .unwrap_or(0);

        if max_frame_len > 1 {
            let keep = max_frame_len - 1;
            if raw_buffer.len() > keep {
                let drain_len = raw_buffer.len() - keep;
                raw_buffer.drain(..drain_len);
            }
        } else {
            raw_buffer.clear();
        }
    }
}

// ===== Tauri Commands =====

#[tauri::command]
pub async fn set_frame_config(
    state: State<'_, Arc<Mutex<SerialState>>>,
    configs: Option<Vec<FrameConfigItem>>,
) -> Result<(), String> {
    if let Some(list) = &configs {
        for cfg in list {
            if cfg.data_length > 8 {
                return Err("dataLength must be <= 8".to_string());
            }
        }
    }

    let s = state.lock().unwrap();
    *s.frame_configs.lock().unwrap() = configs;
    Ok(())
}

#[tauri::command]
pub async fn list_ports() -> Result<Vec<String>, String> {
    match available_ports() {
        Ok(ports) => {
            let names: Vec<String> = ports.into_iter().map(|p| p.port_name).collect();
            Ok(names)
        }
        Err(e) => Err(e.to_string()),
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SerialParity {
    None,
    Even,
    Odd,
}

#[tauri::command]
pub async fn open_port(
    app_handle: tauri::AppHandle,
    state: State<'_, Arc<Mutex<SerialState>>>,
    port_name: String,
    baud_rate: u32,
    parity: SerialParity,
) -> Result<(), String> {
    // 关闭旧端口
    {
        let mut s = state.lock().unwrap();
        s.port = None;
        s.is_reading.store(false, Ordering::Relaxed);
    }

    let parity_setting = match parity {
        SerialParity::None => Parity::None,
        SerialParity::Even => Parity::Even,
        SerialParity::Odd => Parity::Odd,
    };

    let port = serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_millis(50))
        .parity(parity_setting)
        .open()
        .map_err(|e| e.to_string())?;

    {
        let mut s = state.lock().unwrap();
        s.port = Some(port);
        s.is_reading.store(true, Ordering::Relaxed);
    }

    // 启动读取任务
    let state_arc = Arc::clone(&state.inner());
    let app_handle_clone = app_handle.clone();

    tokio::task::spawn(async move {
        let mut raw_buffer: Vec<u8> = Vec::new();
        let mut last_parse_time = Instant::now();
        const PARSE_INTERVAL: Duration = Duration::from_millis(10);
        const MAX_RAW_BUFFER_SIZE: usize = 8192;
        const SKIP_DURATION: Duration = Duration::from_millis(100); // ← 跳过时间（可改）

        let start_time = Instant::now(); // ← 记录启动时刻

        loop {
            let should_continue = {
                let s = state_arc.lock().unwrap();
                s.is_reading.load(Ordering::Relaxed) && s.port.is_some()
            };

            if !should_continue {
                break;
            }

            let mut buf = [0u8; 256];
            let read_result = {
                let mut s = state_arc.lock().unwrap();
                if let Some(ref mut port) = s.port {
                    match port.read(&mut buf) {
                        Ok(n) if n > 0 => Ok(buf[..n].to_vec()),
                        _ => Err(()),
                    }
                } else {
                    Err(())
                }
            };

            if let Ok(data) = read_result {
                // 🚫 统一跳过前 SKIP_DURATION 的所有数据
                if start_time.elapsed() < SKIP_DURATION {
                    // 什么都不做，直接丢弃
                } else {
                    // 获取当前是否启用帧模式
                    let use_frame_mode = {
                        let s = state_arc.lock().unwrap();
                        let x = s.frame_configs.lock().unwrap().is_some();
                        x
                    };

                    if use_frame_mode {
                        raw_buffer.extend_from_slice(&data);

                        if raw_buffer.len() > MAX_RAW_BUFFER_SIZE {
                            let drop_len = raw_buffer.len() - MAX_RAW_BUFFER_SIZE;
                            raw_buffer.drain(..drop_len);
                        }

                        let configs = {
                            let s = state_arc.lock().unwrap();
                            let frame_configs_guard = s.frame_configs.lock().unwrap();
                            frame_configs_guard.clone()
                        };

                        let min_frame_len = configs
                            .as_ref()
                            .map(|list| {
                                list.iter()
                                    .map(|c| c.header.len() + c.data_length)
                                    .min()
                                    .unwrap_or(1)
                            })
                            .unwrap_or(1);

                        if raw_buffer.len() >= min_frame_len
                            && last_parse_time.elapsed() >= PARSE_INTERVAL
                        {
                            parse_frames_and_emit(&mut raw_buffer, configs.clone(), &app_handle_clone)
                                .await;
                            last_parse_time = Instant::now();
                            while raw_buffer.len() >= min_frame_len {
                                parse_frames_and_emit(&mut raw_buffer, configs.clone(), &app_handle_clone)
                                    .await;
                            }
                        }
                    } else {
                        // 非帧模式：聚合后 emit
                        const TIMEOUT_MS: u64 = 20;
                        {
                            let s = state_arc.lock().unwrap();
                            s.buffer.lock().unwrap().extend_from_slice(&data);
                        }

                        let state_clone = Arc::clone(&state_arc);
                        let app_handle_emit = app_handle_clone.clone();

                        tokio::task::spawn(async move {
                            sleep(Duration::from_millis(TIMEOUT_MS)).await;
                            let s = state_clone.lock().unwrap();
                            if s.is_reading.load(Ordering::Relaxed) {
                                let mut buf = s.buffer.lock().unwrap();
                                if !buf.is_empty() {
                                    let data_to_send = buf.clone();
                                    buf.clear();
                                    drop(buf);
                                    drop(s);
                                    let _ = app_handle_emit.emit_to(
                                        "main",
                                        "serial_data",
                                        data_to_send,
                                    );
                                }
                            }
                        });
                    }
                }
            }

            sleep(Duration::from_millis(2)).await;
        }

        // 清理资源
        {
            let mut s = state_arc.lock().unwrap();
            s.is_reading.store(false, Ordering::Relaxed);
            s.buffer.lock().unwrap().clear();
            s.port = None;
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn send_data(
    state: State<'_, Arc<Mutex<SerialState>>>,
    data: SerialData,
) -> Result<(), String> {
    let mut state = state.lock().unwrap();
    if let Some(ref mut port) = state.port {
        match data {
            SerialData::String(s) => {
                port.write_all(s.as_bytes()).map_err(|e| e.to_string())?;
            }
            SerialData::Bytes(b) => {
                port.write_all(&b).map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    } else {
        Err("Serial port not opened".to_string())
    }
}

#[tauri::command]
pub async fn close_port(state: State<'_, Arc<Mutex<SerialState>>>) -> Result<(), String> {
    let mut s = state.lock().unwrap();
    s.port = None;
    s.is_reading.store(false, Ordering::Relaxed);
    Ok(())
}
