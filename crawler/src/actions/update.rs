use serde_json::Value;

use crate::Credits;

/// decrement the user credits
pub async fn decrement_credits(value: &usize, user_id: &String) -> usize {
    use crate::json;
    // rope or vec to prevent max usize limit to go beyond 1 mill later
    let mut concurrent_credits_left = 0;

    // todo: batch decrementing
    match crate::CLIENTS
        .0
        .rpc(
            "decrement_credits",
            &json!({
                "c": &value,
                "u": &user_id,
            })
            .to_string(),
        )
        .execute()
        .await
    {
        Ok(res) => {
            let credits_left: Value = res.json().await.unwrap_or_default();

            if credits_left.is_array() {
                let creds: Vec<Credits> = serde_json::from_value(credits_left).unwrap_or_default();

                for cred in creds {
                    concurrent_credits_left += cred.credits;
                }
            }
        }
        _ => (),
    };

    concurrent_credits_left
}
