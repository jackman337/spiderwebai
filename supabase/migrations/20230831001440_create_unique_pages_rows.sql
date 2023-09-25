ALTER TABLE pages ADD UNIQUE(user_id, domain, url);
ALTER TABLE pages_metadata ADD UNIQUE(user_id, domain, url);

