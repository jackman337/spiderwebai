use crate::utils::upsert_storage;
use spider::bytes::Bytes;
use spider::tokio::fs::File;
use spider::tokio::io::AsyncWriteExt;
use std::path::Path;

/// upload file to supabase
pub async fn upload(dir_name: &str, dir: impl AsRef<Path>, object: &str, bytes_data: &Bytes) {
    match File::create(&dir).await {
        Ok(mut file) => {
            match file.write_all(&bytes_data).await {
                Ok(_) => {
                    match file.flush().await {
                        Ok(_) => {
                            match upsert_storage(&object, &dir_name, &"upload").await {
                                Ok(o) => {
                                    // perform the update to the object
                                    if o.status() == 400 {
                                        let _ = upsert_storage(&object, &dir_name, &"update").await;
                                    }
                                    let resp = match o.text().await {
                                        e => match e {
                                            Ok(_) => {}
                                            Err(e) => {
                                                if e.status().unwrap_or_default() == 409 {
                                                    let _ = upsert_storage(
                                                        &object, &dir_name, &"update",
                                                    )
                                                    .await;
                                                }
                                            }
                                        },
                                    };

                                    resp
                                }
                                Err(e) => {
                                    if e.status().unwrap_or_default() == 409 {
                                        let _ = upsert_storage(&object, &dir_name, &"update").await;
                                    }
                                }
                            };
                        }
                        _ => (),
                    };
                }
                _ => (),
            }
        }
        Err(e) => {
            println!("{:?}", e);
        }
    }
}
