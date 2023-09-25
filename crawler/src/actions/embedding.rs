use crate::json;
use crate::mods::CLIENTS;
use crate::openai_rust;
use serde_json::Value;

/// create an open AI embedding
pub async fn create_embeddings(page_metadata: &serde_json::Value) -> Vec<Value> {
    let page_description = page_metadata["description"].as_str().unwrap_or_default();
    let page_title = page_metadata["title"].as_str().unwrap_or_default();
    let user_id = page_metadata["user_id"].as_str().unwrap_or_default();

    let mut metaset = Vec::from([]);

    // get vectors from openAI
    if !page_description.is_empty() || !page_title.is_empty() {
        let text_embedding = if !page_description.is_empty() {
            page_description
        } else {
            page_title
        };

        let args = openai_rust::embeddings::EmbeddingsArguments::new(
            "text-embedding-ada-002",
            &text_embedding.replace("\n", " "),
            &user_id,
        );

        // TODO: check if AI disabled to prevent call
        match CLIENTS.2.create_embeddings(args).await {
            Ok(embedding) => {
                for embedd in embedding.data.iter() {
                    let mut pg = page_metadata.clone();

                    pg["embedding"] = json!(embedd.embedding);

                    metaset.push(pg);
                }
            }
            _ => (),
        };
    }

    if metaset.is_empty() {
        metaset.push(page_metadata.clone());
    }

    metaset
}
