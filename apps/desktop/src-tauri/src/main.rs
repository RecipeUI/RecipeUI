// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{collections::HashMap, str::FromStr};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_oauth::init())
        .invoke_handler(tauri::generate_handler![fetch_wrapper])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
#[tokio::main]
async fn fetch_wrapper(url: String, payload: Payload) -> Result<FetchServerOutput, String> {
    println!("\nFetching {} with {:?}", url, payload);

    let client = reqwest::Client::new();

    // Create the request builder based on the method
    let mut request_builder = match payload.method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "PATCH" => client.patch(&url),
        "DELETE" => client.delete(&url),
        _ => return Err("Invalid method".to_string().into()),
    };

    let mut is_form_data = false;

    for (key, value) in &payload.headers {
        if key.to_lowercase() == "content-type" && value.contains("form") {
            is_form_data = true;
        } else {
            request_builder = request_builder.header(key, value);
        }
    }

    request_builder = request_builder.header("User-Agent", "RecipeUI/1");

    if payload.body.is_some() {
        let unwrapped_body = payload.body.unwrap();

        if is_form_data {
            let mut form = reqwest::multipart::Form::new();

            // Parse the unwrapped_body as JSON.
            if let Ok(json_body) = serde_json::Value::from_str(&unwrapped_body) {
                if let Some(body_map) = json_body.as_object() {
                    for (key, value) in body_map {
                        // Assuming all values are simple strings for simplicity.
                        if let Some(value_str) = value.as_str() {
                            form = form.text(key.to_string(), value_str.to_string());
                        }
                    }
                }
            } else {
                // Handle JSON parsing error if necessary.
            }

            println!("Form: {:?}", form);
            request_builder = request_builder.multipart(form);
        } else {
            request_builder = request_builder.body(unwrapped_body);
        }
    }

    println!("\nSending request to {}", url);
    println!("\nRequest: {:?}", request_builder);

    let response = request_builder.send().await.map_err(|e| e.to_string())?;

    println!("\nResponse: {:?}", response);

    let status = response.status().as_u16();
    let headers = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect::<HashMap<String, String>>();

    let content_type = headers
        .get("content-type")
        .unwrap_or(&"text/plain".to_string())
        .clone();

    let output = response.text().await.map_err(|e| e.to_string())?;
    println!("Output: {:?}", output);

    Ok(FetchServerOutput {
        output,
        status,
        contentType: content_type,
        headers,
    })
}

#[derive(Debug, Serialize)]
struct FetchServerOutput {
    output: String,
    status: u16,
    #[allow(non_snake_case)]
    contentType: String,
    headers: HashMap<String, String>,
}
#[derive(Debug, Deserialize)]
struct Payload {
    method: String,
    headers: HashMap<String, String>,
    body: Option<String>,
}
