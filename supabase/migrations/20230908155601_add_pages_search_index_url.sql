-- alter table
--   pages
-- add column
--   fts tsvector generated always as (to_tsvector('english', pathname)) stored;

-- create index pages_fts on pages using gin (fts);