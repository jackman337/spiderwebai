#![allow(dead_code)]
#[cfg(all(
    not(windows),
    not(target_os = "android"),
    not(target_os = "freebsd"),
    feature = "jemalloc"
))]
#[global_allocator]
static GLOBAL: jemallocator::Jemalloc = jemallocator::Jemalloc;
extern crate dotenv;

pub mod actions;
pub mod locales;
pub mod mods;
pub mod openai_rust;
pub mod parse;
pub mod spider_core;
pub mod storage;
pub mod utils;
pub mod webhooks;

use crate::webhooks::{send_webhook, Webhook};
use futures_util::future::join;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use parse::parse_sqs_event;
use serde_json::{json, Value};
use spider::tokio::sync::Semaphore;
// use spider::utils::log;
use crate::tokio::time::Instant;
use locales::response_message::get_message;
use mods::CLIENTS;
use spider::tokio;
use tokio::sync::mpsc;
use tokio_stream::StreamExt;

pub use spider::{
    string_concat::{string_concat, string_concat_impl},
    website::Website,
};

use crate::actions::{embedding::create_embeddings, update::decrement_credits};
use crate::utils::create_meta_data;
use crate::utils::upsert_record;
use spider_core::core_parse;
use std::{
    collections::VecDeque,
    sync::{atomic::Ordering, Arc},
};

/// The credits for a user
#[allow(dead_code)]
#[derive(serde::Deserialize, Debug, Clone, Default)]
pub struct Credits {
    /// id random generated primary key
    id: String,
    /// user id
    user_id: String,
    /// the amount of credits left
    credits: usize,
    /// the created data
    created_at: String,
    /// the date updated
    updated_at: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let func = service_fn(lambda_handler);
    lambda_runtime::run(func).await?;
    Ok(())
}

async fn lambda_handler(event: LambdaEvent<Value>) -> Result<Value, Error> {
    let (event, _context) = event.into_parts();
    let (users, request_allowed) = parse_sqs_event(event);
    let mut stream = tokio_stream::iter(users);

    while let Some(user) = stream.next().await {
        let url = user.url;
        let user_id = user.user_id;
        let authorization = user.authorization.unwrap_or_default();

        // add a new client for sending hooks to the destination
        let webhook_client = match user.webhook {
            Some(hook) => {
                match spider::url::Url::parse(&hook.destination) {
                    Ok(_) => {
                        let client = spider::reqwest::ClientBuilder::new()
                            .build()
                            .unwrap_or_default();
                        // TODO: pass a list of webhook events
                        Some((client, hook))
                    }
                    _ => None,
                }
            }
            _ => None,
        };

        let credi_builder = CLIENTS.0.from("credits").eq("user_id", &user_id).single();
        // API key used
        let credi_builder = if !request_allowed {
            credi_builder.auth(&authorization)
        } else {
            credi_builder
        };

        let mut user_credits = match credi_builder.execute().await {
            Ok(resp) => {
                serde_json::from_str(&resp.text().await.unwrap_or_default()).unwrap_or_default()
            }
            _ => Credits::default(),
        };

        let credits = user_credits.credits;

        // prevent crawls when limit is reached
        let hard_limit = match user.hard_limit {
            Some(limit) => limit + credits,
            _ => 0,
        };

        // patch the user_id since user does not unwrap on negative value from credits builder.
        if user_credits.user_id.is_empty() && !user_id.is_empty() {
            user_credits.user_id = user_id.clone();
        }

        // prevent crawl from processing invalid - this will never fire with the current arch setup.
        if credits == 0 && !user.has_sub.is_none() && user.has_sub.unwrap_or_default() == false {
            return Ok(json!({
                "code": if user_id.is_empty() { 401 } else { 402 },
                "success": false,
                "payload": {
                    "message": get_message(if !request_allowed && authorization.is_empty()  { 10 } else { 0 }, &"en")
                }
            }));
        }

        let mut website = Website::new(&url);

        website.set_crawl_budget(user.budget);

        let proxy_enabled = match user.proxy_enabled {
            Some(enabled) => {
                if enabled {
                    match dotenv::var("PROXY_URLS") {
                        Ok(proxylist) => {
                            website.with_proxies(Some(
                                proxylist.split(",").map(String::from).collect(),
                            ));

                            true
                        }
                        _ => false,
                    }
                } else {
                    false
                }
            }
            _ => false,
        };

        match website.subscribe(888) {
            Some(mut rx2) => {
                println!(
                    "Crawl Starting: {}\nSubscribed to channel with {} credits.",
                    &url, &user_credits.credits
                );

                // pages channel
                let (tx, mut rx) = mpsc::channel::<Value>(20);
                // pages meta_data channel
                let (txx, mut rxx) = mpsc::channel::<_>(10);
                // storage channel
                let (txxx, mut rxxx) = mpsc::channel::<_>(10);
                // credits used channel
                let (txc, mut rxc) = mpsc::channel::<_>(10);

                let domain_name = website.get_domain_parsed().clone();
                let domain_name = match domain_name.as_ref() {
                    Some(dname) => dname.domain().unwrap_or_default(),
                    _ => Default::default(),
                };

                let shared = Arc::new((
                    std::sync::atomic::AtomicI8::new(0),
                    url,
                    webhook_client,
                    user_credits,
                ));

                // move into threads and spawn
                let shared_handle = shared.clone();
                let has_subscription = user.has_sub.unwrap_or_default();
                // The start of the crawl before any links are found.
                let start = Instant::now();

                // pass uid per thread
                let user_id2 = user_id.clone();
                let user_id3 = user_id.clone();

                // TODO: capture the url sent and see if the request matches it on return to get the favicon url and other
                // metadata to attach to the root website
                // peform on every page found
                let subscribe_handle = tokio::spawn(async move {
                    // TODO: determine limit of concurrency based on if they have a sub or not and how much usage.
                    let concurrent_limit = if shared_handle.3.credits > 55000 || has_subscription {
                        4
                    } else {
                        2
                    };

                    // use credits to get a gist of allowed spawns up front to improve speed TODO: adjust limit based on credits during crawl
                    let semaphore = Arc::new(Semaphore::new(concurrent_limit));

                    while let Ok(res) = rx2.recv().await {
                        // crawl shutdown exit
                        if shared_handle.0.load(Ordering::Relaxed) == 3 {
                            break;
                        }
                        // TODO: single state.
                        let txxx = txxx.clone();
                        let txx = txx.clone();
                        let tx = tx.clone();
                        let txc = txc.clone();

                        // if the user has tons of credits and concurrency is up spawn threads.
                        // $2.50 allow thread spawns we know it should be ok for now. Todo add atomic pressure counter
                        match semaphore.clone().acquire_owned().await {
                            Ok(permit) => {
                                let shared_handle = shared_handle.clone();

                                tokio::spawn(async move {
                                    core_parse(
                                        &res,
                                        (&shared_handle.3, &shared_handle.1),
                                        (txxx, txx, tx, txc),
                                        &shared_handle.0,
                                        start,
                                        &shared_handle.2,
                                        has_subscription,
                                        proxy_enabled,
                                    )
                                    .await;
                                    drop(permit);
                                });
                            }
                            _ => {
                                core_parse(
                                    &res,
                                    (&shared_handle.3, &shared_handle.1),
                                    (txxx, txx, tx, txc),
                                    &shared_handle.0,
                                    start,
                                    &shared_handle.2,
                                    has_subscription,
                                    proxy_enabled,
                                )
                                .await
                            }
                        };
                    }
                    drop(txx);
                    drop(txxx);
                    drop(tx);
                    drop(txc);
                });

                let q_handle: tokio::task::JoinHandle<VecDeque<Value>> = tokio::spawn(async move {
                    let mut q: VecDeque<Value> = VecDeque::new();
                    let mut pressure = 1;

                    // determine time and frequency on handling upserts for pages for real streaming queues or VecDequeTimer.
                    while let Some(message) = rx.recv().await {
                        q.push_back(message);

                        // improve logic when to perform request mid queue instead of every 2
                        if q.len() == pressure {
                            let a = Value::Array(q.drain(..).collect::<Vec<_>>());
                            upsert_record("pages", ("user_id", &user_id2), &a).await;
                            if pressure > 37 {
                                pressure = 1;
                            }
                            pressure += 1;
                        }
                    }

                    q
                });

                let qq_handle: tokio::task::JoinHandle<VecDeque<(String, Value)>> =
                    tokio::spawn(async move {
                        let mut q: VecDeque<(String, Value)> = VecDeque::new();
                        let mut pressure = 1;

                        while let Some(message) = rxx.recv().await {
                            q.push_back(message);

                            // improve logic when to perform request mid queue instead of every 2
                            if q.len() == pressure {
                                let page_drained = q.drain(..);
                                let mut items = Vec::new();

                                for item in page_drained {
                                    // todo: create in spawn
                                    let embedded_item = create_embeddings(&item.1).await;

                                    items.extend(embedded_item);
                                }

                                let a = Value::Array(items.drain(..).collect::<Vec<_>>());
                                let user_id3 = user_id3.clone();

                                tokio::spawn(async move {
                                    upsert_record("pages_metadata", ("user_id", &user_id3), &a)
                                        .await;
                                });

                                if pressure > 20 {
                                    pressure = 1;
                                }

                                pressure += 4;
                            }
                        }

                        q
                    });

                let join_handle = tokio::spawn(async move {
                    website.crawl().await;
                });

                // finish all storage uploads send channel messages to vec
                let file_handles = tokio::spawn(async move {
                    let mut items = Vec::new();

                    while let Some(message) = rxxx.recv().await {
                        items.push(message);
                    }

                    items
                });

                let mut usage = 0;

                // track usage for the crawl
                let join_handle = {
                    while let Some(message) = rxc.recv().await {
                        usage += message;
                        if hard_limit > 0 && usage > hard_limit {
                            // println!("Crawl shutdown usage used {:?}", usage);
                            subscribe_handle.abort();
                            join_handle.abort();
                            shared.0.store(3, Ordering::Relaxed);
                            break;
                        }
                    }

                    join_handle
                };

                if !join_handle.is_finished() {
                    let _ = join(subscribe_handle, join_handle).await;
                }

                // batching the rest of the db
                let qj = join(q_handle, qq_handle).await;

                // finish page uploading
                match qj.0 {
                    Ok(q) => {
                        if q.len() > 0 {
                            let a = Value::Array(q.into());
                            upsert_record("pages", ("user_id", &user_id), &a).await;
                        }
                    }
                    _ => (),
                };

                // finish page metadata uploading
                match qj.1 {
                    Ok(mut q) => {
                        if q.len() > 0 {
                            let page_drained = q.drain(..);
                            let mut items = Vec::new();

                            for item in page_drained {
                                let embedded_item = create_embeddings(&item.1).await;

                                items.extend(embedded_item);
                            }

                            let a = Value::Array(items.drain(..).collect::<Vec<_>>());

                            upsert_record("pages_metadata", ("user_id", &user_id), &a).await;
                        }
                    }
                    _ => (),
                };

                // finish all storage uploads
                match file_handles.await {
                    Ok(h) => {
                        for item in h {
                            match item.await {
                                _ => (),
                            };
                        }
                    }
                    _ => (),
                };

                // if user has no credits send usage report
                if credits == 0 && has_subscription || has_subscription && credits < usage {
                    match std::env::var("APP_API_URL") {
                        Ok(api_url) => {
                            // println!("{:?} used {:?} credits.", user_id, usage);
                            let _ = spider::reqwest::Client::post(&Default::default(), &api_url)
                                .header("authorization", &authorization)
                                // .header("www-authenticate", &std::env::var("APP_WEBHOOK_SECRET").unwrap_or("secretsecret".to_string()))
                                .body(
                                    json!({
                                        "usage": usage,
                                        "user_id": user_id,
                                    })
                                    .to_string(),
                                )
                                .send()
                                .await;
                        }
                        _ => (),
                    }
                }

                // if not shutdown update amount
                if shared.0.load(Ordering::Relaxed) != 3 {
                    let body = json!({
                        "user_id": &user_id,
                        "domain": &domain_name,
                        "links": 0,
                        "credits_used": 0, // todo: add the creds used from the start
                        "mode": 1,
                        "crawl_duration": start.elapsed().as_millis()
                    });

                    if !shared.2.is_none() {
                        send_webhook(&shared.2, body.to_string(), "crawl_state").await;
                    }

                    upsert_record("crawl_state", ("user_id", &user_id), &body).await;
                }

                println!("Crawl finished: {}", &shared.1);
            }
            _ => {
                println!("Failed to crawl website channel full.");
            }
        };
    }

    Ok(json!({
        "code": 200,
        "success": true,
        "payload": {
            "message": get_message(2, &"en")
        }
    }))
}

#[tokio::test]
async fn test_my_lambda_handler() {
    let input = serde_json::json!({ "user_id": "185f2f83-d63a-4c9b-b4a0-7e4a885799e2", "url": "https://jeffmendez.com" });
    let context = lambda_runtime::Context::default();
    let event = lambda_runtime::LambdaEvent::new(input, context);

    lambda_handler(event).await.expect("failed to handle event");
}
