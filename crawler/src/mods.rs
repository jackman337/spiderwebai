use crate::openai_rust;
use crate::string_concat;
use crate::string_concat_impl;
use postgrest::Postgrest;
use spider::lazy_static::lazy_static;
use spider::packages::scraper::selector::Selector;
use supabase_storage::config::SupabaseConfig;
use supabase_storage::Storage;

lazy_static! {
    /// client for supabase request
    pub static ref CLIENTS: (Postgrest, Storage, openai_rust::Client) = {
        // load configs for the lambda
        match dotenv::var("LAMBDA") {
            Ok(e) => {
                if !e.is_empty() {
                    dotenv::from_filename(string_concat!(".env", if e.starts_with(".") { ""} else { "." }, e)).ok()
                } else {
                    dotenv::dotenv().ok()
                }
            }
            _ => dotenv::dotenv().ok()
        };

        let supabase_url = dotenv::var("SUPABASE_API_URL").unwrap_or("http://localhost:54321/rest/v1/".into());
        let supabase_api_key = dotenv::var("SUPABASE_API_KEY").unwrap_or("".into());
        let open_ai_disabled = dotenv::var("OPENAI_API_DISABLED").unwrap_or("".into());
        let openai_api_key = if open_ai_disabled == "true" { String::from("") } else { dotenv::var("OPENAI_API_KEY").unwrap_or("".into()) };

        let client = Postgrest::new(&supabase_url);
        let client = if !supabase_api_key.is_empty() {
            client.insert_header(
                "apikey",
                &supabase_api_key)
                .insert_header(
                    "Authorization",
                    &string_concat!("Bearer ", supabase_api_key))
        } else {
            client
        };

        let config = SupabaseConfig::default();
        let storage = Storage::new_with_config(config);
        let openai_client = openai_rust::Client::new(&openai_api_key);

        (client, storage, openai_client)
    };

    /// CSS Page selectors
    pub static ref PAGE_SELECTORS: (Selector, Selector) = {
        unsafe {
            (Selector::parse(r#"title"#).unwrap_unchecked(), Selector::parse(r#"meta[name="description"]"#).unwrap_unchecked())
        }
    };
}
