use crate::webhooks::Webhook;
use aws_sqs_types::Event;
use spider::{hashbrown::HashMap, CaseInsensitiveString};

#[derive(serde::Serialize, serde::Deserialize, Debug, Default)]
pub struct RequestParams {
    /// the user id for the request
    pub user_id: String,
    /// the url to crawl
    pub url: String,
    /// if proxies are enabled for the request.
    pub proxy_enabled: Option<bool>,
    /// webhook destination for all data
    pub webhook: Option<Webhook>,
    /// authorization data
    pub authorization: Option<String>,
    /// the hard limit to not exceed
    pub hard_limit: Option<usize>,
    /// the user has a subscription
    pub has_sub: Option<bool>,
    /// the crawl budget
    pub budget: Option<HashMap<CaseInsensitiveString, u32>>,
}

/// parse an sqs event from amazon
pub fn parse_sqs_event(event: serde_json::Value) -> (Vec<RequestParams>, bool) {
    // SQS Event
    if event.is_object() && event["Records"].is_array() {
        let data: Event = serde_json::from_value(event).unwrap_or_default();

        (
            data.records
                .into_iter()
                .filter_map(|r| {
                    let mut b: RequestParams = serde_json::from_str(&r.body).unwrap_or_default();

                    match r.message_attributes.unwrap_or_default().get("headers") {
                        Some(header) => b.authorization = Some(header.string_value.clone()),
                        _ => (),
                    };

                    Some(b)
                })
                .collect::<Vec<RequestParams>>(),
            true,
        )
    } else {
        let domain_name = event["requestContext"]["domainName"]
            .as_str()
            .unwrap_or_default()
            .to_string();

        let authorization = event["headers"]["authorization"]
            .as_str()
            .unwrap_or_default()
            .to_string();

        let mut u: RequestParams = if event.is_object() && event["body"].is_null() {
            serde_json::from_value(event).unwrap_or_default()
        } else {
            serde_json::from_str(&event["body"].as_str().unwrap_or_default()).unwrap_or_default()
        };

        u.authorization = Some(authorization);        

        let whitelist = dotenv::var("WHITE_LIST_URLS").unwrap_or("http://localhost:3000".into());

        (Vec::from([u]), whitelist == domain_name)
    }
}
