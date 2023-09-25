insert into
  storage.buckets (id, name)
select
  'resource',
  'resource'
where
  not exists (
    select
      1
    from
      storage.buckets
    where
      id = 'resource'
  );