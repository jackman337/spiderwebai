use anyhow::{anyhow, Result};
use lazy_static::lazy_static;
use spider::reqwest;

pub extern crate futures_util;

lazy_static! {
    static ref BASE_URL: reqwest::Url =
        reqwest::Url::parse("https://api.openai.com/v1/models").unwrap();
}

/// This is the main interface to interact with the api.
pub struct Client {
    req_client: reqwest::Client,
}

/// See <https://platform.openai.com/docs/api-reference/embeddings>.
pub mod embeddings;
/// See <https://platform.openai.com/docs/api-reference/models>.
pub mod models;

impl Client {
    /// Create a new client.
    /// This will automatically build a [reqwest::Client] used internally.
    pub fn new(api_key: &str) -> Client {
        use reqwest::header;

        // Create the header map
        let mut headers = header::HeaderMap::new();
        let mut key_headervalue =
            header::HeaderValue::from_str(&format!("Bearer {api_key}")).unwrap();
        key_headervalue.set_sensitive(true);
        headers.insert(header::AUTHORIZATION, key_headervalue);
        let req_client = reqwest::ClientBuilder::new()
            .default_headers(headers)
            .build()
            .unwrap();

        Client { req_client }
    }

    /// List and describe the various models available in the API. You can refer to the [Models](https://platform.openai.com/docs/models) documentation to understand what models are available and the differences between them.
    ///
    /// ```no_run
    /// # let api_key = "";
    /// # tokio_test::block_on(async {
    /// let client = openai_rust::Client::new(api_key);
    /// let models = client.list_models().await.unwrap();
    /// # })
    /// ```
    ///
    /// See <https://platform.openai.com/docs/api-reference/models/list>.
    pub async fn list_models(&self) -> Result<Vec<models::Model>, anyhow::Error> {
        let mut url = BASE_URL.clone();
        url.set_path("/v1/models");

        let res = self.req_client.get(url).send().await?;

        if res.status() == 200 {
            Ok(res.json::<models::ListModelsResponse>().await?.data)
        } else {
            Err(anyhow!(res.text().await?))
        }
    }

    /// Get a vector representation of a given input that can be easily consumed by machine learning models and algorithms.
    ///
    /// See <https://platform.openai.com/docs/api-reference/embeddings>
    ///
    /// ```no_run
    /// # use openai_rust;
    /// # use tokio_test;
    /// # tokio_test::block_on(async {
    /// # let api_key = "";
    /// let c = openai_rust::Client::new(api_key);
    /// let args = openai_rust::embeddings::EmbeddingsArguments::new("text-embedding-ada-002", "The food was delicious and the waiter...".to_owned());
    /// println!("{}", c.create_embeddings(args).await.unwrap().data);
    /// # })
    /// ```
    ///
    pub async fn create_embeddings(
        &self,
        args: embeddings::EmbeddingsArguments,
    ) -> Result<embeddings::EmbeddingsResponse> {
        let mut url = BASE_URL.clone();
        url.set_path("/v1/embeddings");

        let res = self.req_client.post(url).json(&args).send().await?;

        if res.status() == 200 {
            Ok(res.json::<embeddings::EmbeddingsResponse>().await?)
        } else {
            Err(anyhow!(res.text().await?))
        }
    }
}
