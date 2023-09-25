use crate::mods::CLIENTS;
use serde_json;
use spider::bytes::Bytes;
use spider::{
    string_concat::{string_concat, string_concat_impl},
    tokio::task::JoinHandle,
    url::Url,
    utils::log,
};

/// get the path we should store the object under
pub fn path_to_storage_path(url: &spider::url::Url, raw_link: &str) -> (String, String) {
    let pname = url.path();

    // check if raw url is also a trailing slash.
    (
        if pname == "/" {
            string_concat!(
                &pname,
                if raw_link.ends_with("/") { "/" } else { "" },
                "index.html"
            )
        } else {
            string_concat!(
                &pname,
                if !pname.contains(".") {
                    if raw_link.ends_with("/") {
                        "index.html"
                    } else {
                        ".html"
                    }
                } else {
                    ""
                }
            )
        },
        pname.into(),
    )
}

/// update the storage of the database
pub async fn upsert_storage(
    object: &str,
    file_path: &str,
    method: &str,
) -> core::result::Result<spider::reqwest::Response, spider::reqwest::Error> {
    let builder = CLIENTS.1.from();

    match if method == "upload" {
        builder
            .upload_object("resource", &object, &file_path)
            .await
            .execute()
            .await
    } else {
        builder
            .update_object_async("resource", &object, &file_path)
            .await
            .execute()
            .await
    } {
        response => response,
    }
}

/// upsert table by column eq
pub async fn upsert_record(table: &str, eq: (&str, &str), data: &serde_json::Value) {
    let body = data.to_string();
    let builder = CLIENTS.0.from(table).eq(eq.0, &eq.1);

    let builder = if table == "pages" || table == "pages_metadata" {
        builder.on_conflict("user_id,domain,url")
    } else if table == "crawl_state" {
        builder.on_conflict("user_id,domain")
    } else {
        builder
    };

    // .on_conflict("user_id, domain, url")
    match builder.upsert(&body).execute().await {
        Ok(e) => {
            // Duplicate Key perform UPDATE TODO: use RPC calls instead to avoid dupliate trips
            if e.status() == 409 {
                match CLIENTS
                    .0
                    .from(table)
                    .eq(eq.0, &eq.1)
                    .update(&body)
                    .execute()
                    .await
                {
                    _ => (),
                }
            }

            log("Inserted ", &body);
        }
        Err(error) => log("Can't insert ", &error.to_string()),
    }
}

/// create the meta object for creating files
pub async fn create_meta_data(
    user_id: &str,
    u: &Url,
    b: &Option<&Bytes>,
    raw_link: &str,
) -> (String, String, String, String, Option<JoinHandle<()>>) {
    let f = crate::utils::path_to_storage_path(&u, &raw_link);
    let fp = f.0;
    let fp = fp.replace("/", "*_*");
    let mut dir = std::env::temp_dir();

    dir.push(&fp);

    let p = fp.replacen("*_*", "/", 1).replacen("/", "", 1);

    let domain = u.domain().unwrap_or_default();

    let object = string_concat!(&user_id, "/", &domain, "/", p);

    let resource = p.split(".").collect::<Vec<&str>>();
    let resource = if resource.len() >= 2 {
        resource[resource.len() - 1]
    } else {
        resource[0]
    };

    // move storage upload to background thread
    let handle = match b.cloned() {
        Some(bb) => {
            let object = object.clone();
            let dir = dir.clone();

            Some(crate::tokio::spawn(async move {
                crate::storage::upload(&dir.to_str().unwrap_or_default(), &dir, &object, &bb).await;
                // match spider::tokio::fs::remove_file(&dir).await {
                //     _ => (),
                // };
            }))
        }
        _ => None,
    };

    (
        resource.to_string(),
        object,
        domain.to_string(),
        f.1,
        handle,
    )
}
