/// the message for the status todo: use dictionary for language
pub fn get_message(status: i32, lang: &str) -> &'static str {
    if !lang.is_empty() || lang == "en" {
        if status == 0 {
            "Crawl did not start, no credits"
        } else if status == 1 {
            "Crawl shutdown"
        } else if status == 10 {
            "Not Authorized"
        } else {
            "Crawl complete"
        }
    } else {
        ""
    }
}
