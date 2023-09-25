use spider::reqwest::{Body, Client};

#[derive(serde::Serialize, serde::Deserialize, Debug, Default)]
pub struct Webhook {
    /// the webhook destination
    pub destination: String,
    /// on credits depleted
    pub on_credits_depleted: bool,
    /// on credits half depleted
    pub on_credits_half_depleted: bool,
    /// on websites status update event
    pub on_website_status: bool,
    /// on new page find send (links, bytes) to destination or as much info as possible
    pub on_find: bool,
    /// on page metadata handling
    pub on_find_metadata: bool,
}

/// post a webhook to a destination
pub async fn send_webhook<T>(webhook_client: &Option<(Client, Webhook)>, body: T, event: &str)
where
    T: Into<Body>,
{
    match webhook_client {
        Some(c) => {
            let webhook_send = match event {
                "on_credits_depleted" if c.1.on_credits_depleted => true,
                "on_credits_half_depleted" if c.1.on_credits_half_depleted => true,
                "on_find" if c.1.on_find => true,
                "on_find_metadata" if c.1.on_find_metadata => true,
                "on_website_status" if c.1.on_website_status => true,
                _ => false,
            };

            if webhook_send {
                let _ = c.0.post(&c.1.destination).body(body).send().await;
            }
        }
        _ => (),
    }
}
