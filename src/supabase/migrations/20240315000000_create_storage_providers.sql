
create type storage_provider as enum ('aws', 'google', 'backblaze', 'wasabi', 'cloudflare');

create table storage_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider storage_provider not null,
  is_active boolean default false,
  credentials jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table storage_providers enable row level security;

create policy "Only admins can manage storage providers"
  on storage_providers
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Add function to automatically update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_storage_providers_updated_at
    before update on storage_providers
    for each row
    execute function update_updated_at_column();
