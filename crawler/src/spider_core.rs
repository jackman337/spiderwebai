use crate::actions::meta_data::extract_metadata;
use crate::create_meta_data;
use crate::decrement_credits;
use crate::tokio::time::Instant;
use crate::{send_webhook, Credits, Webhook};
use serde_json::{json, Value};
use spider::reqwest::Client;
use spider::tokio::sync::mpsc::Sender;
use spider::tokio::task::JoinHandle;
use std::ops::Mul;
use std::sync::atomic::AtomicI8;
use std::sync::atomic::Ordering;

pub use spider::{
    string_concat::{string_concat, string_concat_impl},
    website::Website,
};

/// the core parsing logic for our system
pub async fn core_parse(
    res: &spider::page::Page,
    (user_credits, _url): (&Credits, &String),
    (txxx, txx, tx, txc): (
        Sender<JoinHandle<()>>,
        Sender<(String, Value)>,
        Sender<Value>,
        Sender<usize>,
    ),
    status_handle: &AtomicI8,
    start: Instant,
    webhook_client: &Option<(Client, Webhook)>,
    has_subscription: bool,
    proxy_enabled: bool,
) {
    let uptime: usize = res.get_duration_elasped().as_millis() as usize;
    let link = res.get_url();
    let b: Box<String> = Box::new(res.get_html());

    let file_size = b.len();
    let file_cost = ((file_size / 400) / 2).max(2);
    let uptime_cost = ((uptime / 80) / 2).max(3);

    let uptime_cost = if proxy_enabled {
        (uptime_cost as f32).mul(1.35) as usize
    } else {
        uptime
    };

    // add webhook usage static cost should blend latency with it.
    let pad_webhook_cost = if webhook_client.is_none() { 0 } else { 5 };

    // the file bytes to deduct credits
    let uptime = uptime_cost + file_cost + pad_webhook_cost;

    let has_credits = user_credits.credits > 0;

    // exit if credits are depleted and no subscription
    if !has_subscription && has_credits && status_handle.load(Ordering::Relaxed) == 3 {
        return;
    }

    // if credits allowed continue todo: add record if credits existed but, ran out complete
    if has_credits && decrement_credits(&uptime, &user_credits.user_id).await <= 0 {
        if !has_subscription {
            status_handle.store(3, Ordering::Relaxed);
        }
        let body = json!({
            "user_id": &user_credits.user_id,
            "domain": &res.get_url_parsed().domain().unwrap_or_default(),
            "links": 0,
            "credits_used": 0,
            "mode": 3,
            "crawl_duration": start.elapsed().as_millis()
        });

        if !webhook_client.is_none() {
            send_webhook(&webhook_client, body.to_string(), "on_credits_depleted").await;
        }
    }

    let u = res.get_url_parsed();

    // resource handling and url targets
    let (resource, object, domain, pathname, fs_handle) =
        create_meta_data(&user_credits.user_id, &u, &res.get_bytes(), &link).await;

    // send the credits used back
    match txc.reserve().await {
        Ok(permit) => {
            permit.send(uptime);
        }
        _ => println!("dropped channel"),
    };

    // send page data handle
    match tx.reserve().await {
        Ok(permit) => {
            let page_data = json!({
                "user_id": &user_credits.user_id,
                "url": &object,
                "domain": &domain,
                "pathname": &pathname
            });

            if !webhook_client.is_none() {
                // TODO: send detailed event data in page
                send_webhook(&webhook_client, page_data.to_string(), "on_find").await;
            }

            permit.send(page_data);
        }
        _ => println!("dropped channel"),
    };

    // send page_metadata channel
    match txx.reserve().await {
        Ok(permit) => {
            let (page_title, page_description) = extract_metadata(&b, &resource);

            let page_metadata = json!({
                "user_id": &user_credits.user_id,
                "url": &object,
                "domain": &domain,
                "resource_type": &resource,
                "file_size": &file_size,
                "title": &page_title,
                "description": &page_description,
                "pathname": &pathname
            });

            // TODO: send event with openAI embedding
            if !webhook_client.is_none() {
                // TODO: send detailed event data in page
                send_webhook(
                    webhook_client,
                    page_metadata.to_string(),
                    "on_find_metadata",
                )
                .await;
            }

            permit.send((object, page_metadata));
        }
        _ => println!("dropped metadata channel"),
    };

    // file storage
    match fs_handle {
        Some(fs_handle) => {
            match txxx.reserve().await {
                Ok(permit) => {
                    permit.send(fs_handle);
                }
                _ => println!("dropped fs channel"),
            };
        }
        _ => (),
    };
}
