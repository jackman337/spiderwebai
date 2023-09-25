use crate::mods::PAGE_SELECTORS;
use spider::packages::scraper::Html;

/// extract meta data from a node
pub fn extract_metadata(b: &str, resource: &str) -> (String, String) {
    // TODO: use raw parser for better performance increase of putting all to one html docuement
    let fragment = Box::new(Html::parse_document(&b));
    let mut page_title = String::new();
    let mut page_description = page_title.clone();

    // todo: add async fragment.select handling
    if resource == "html" {
        for element in fragment.select(&PAGE_SELECTORS.0) {
            page_title = element.inner_html().to_string();
            break;
        }
        for element in fragment.select(&PAGE_SELECTORS.1) {
            page_description = element
                .value()
                .attr("content")
                .unwrap_or_default()
                .to_string();
            break;
        }
    }

    (page_title, page_description)
}
