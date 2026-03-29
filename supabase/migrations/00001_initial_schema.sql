-- migration: 00001_initial_schema
-- purpose: create LinkDigest core tables with RLS
-- affected tables: workspaces, channels, users, messages, urls, tags
--
-- NOTE: workspaces and channels select policies are deferred until after
-- the users table is created, because they reference public.users.

-- ============================================================
-- 1. workspaces — Slack workspace (select policy deferred)
-- ============================================================
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slack_team_id text unique not null,
  name text not null,
  icon_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.workspaces enable row level security;

create policy "service role manages workspaces"
  on public.workspaces for all
  to service_role
  using (true)
  with check (true);

-- ============================================================
-- 2. channels — Slack channel (select policy deferred)
-- ============================================================
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slack_channel_id text not null,
  name text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (workspace_id, slack_channel_id)
);

alter table public.channels enable row level security;

create policy "service role manages channels"
  on public.channels for all
  to service_role
  using (true)
  with check (true);

-- ============================================================
-- 3. users — Slack user
-- ============================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  slack_user_id text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (workspace_id, slack_user_id)
);

alter table public.users enable row level security;

create policy "users can view users in own workspace"
  on public.users for select
  to authenticated
  using (
    workspace_id in (
      select u.workspace_id from public.users u
      where u.auth_user_id = (select auth.uid())
    )
  );

create policy "service role manages users"
  on public.users for all
  to service_role
  using (true)
  with check (true);

-- ============================================================
-- 4. Deferred select policies for workspaces and channels
--    (now that public.users exists)
-- ============================================================
create policy "users can view own workspaces"
  on public.workspaces for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.workspace_id = workspaces.id
        and u.auth_user_id = (select auth.uid())
    )
  );

create policy "users can view channels in own workspace"
  on public.channels for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.workspace_id = channels.workspace_id
        and u.auth_user_id = (select auth.uid())
    )
  );

-- ============================================================
-- 5. messages — link messages
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  slack_message_ts text not null,
  summary text,
  card_images text[] default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'summarized', 'complete', 'failed')),
  share_token text unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (channel_id, slack_message_ts)
);

alter table public.messages enable row level security;

create policy "users can view messages in own workspace"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.channels c
      join public.users u on u.workspace_id = c.workspace_id
      where c.id = messages.channel_id
        and u.auth_user_id = (select auth.uid())
    )
  );

create policy "anyone can view shared messages by share_token"
  on public.messages for select
  to anon
  using (share_token is not null);

create policy "service role manages messages"
  on public.messages for all
  to service_role
  using (true)
  with check (true);

-- ============================================================
-- 6. urls — URLs within a message (max 5)
-- ============================================================
create table if not exists public.urls (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  url text not null,
  title text,
  position smallint not null default 0,
  created_at timestamptz default now() not null
);

alter table public.urls enable row level security;

create policy "users can view urls in own workspace"
  on public.urls for select
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      join public.channels c on c.id = m.channel_id
      join public.users u on u.workspace_id = c.workspace_id
      where m.id = urls.message_id
        and u.auth_user_id = (select auth.uid())
    )
  );

create policy "anon can view urls of shared messages"
  on public.urls for select
  to anon
  using (
    exists (
      select 1 from public.messages m
      where m.id = urls.message_id
        and m.share_token is not null
    )
  );

create policy "service role manages urls"
  on public.urls for all
  to service_role
  using (true)
  with check (true);

-- ============================================================
-- 7. tags — auto-generated tags
-- ============================================================
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  name text not null,
  created_at timestamptz default now() not null
);

alter table public.tags enable row level security;

create policy "users can view tags in own workspace"
  on public.tags for select
  to authenticated
  using (
    exists (
      select 1 from public.messages m
      join public.channels c on c.id = m.channel_id
      join public.users u on u.workspace_id = c.workspace_id
      where m.id = tags.message_id
        and u.auth_user_id = (select auth.uid())
    )
  );

create policy "anon can view tags of shared messages"
  on public.tags for select
  to anon
  using (
    exists (
      select 1 from public.messages m
      where m.id = tags.message_id
        and m.share_token is not null
    )
  );

create policy "service role manages tags"
  on public.tags for all
  to service_role
  using (true)
  with check (true);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
create index idx_channels_workspace on public.channels(workspace_id);
create index idx_users_workspace on public.users(workspace_id);
create index idx_users_auth_user on public.users(auth_user_id);
create index idx_messages_channel on public.messages(channel_id);
create index idx_messages_status on public.messages(status);
create index idx_messages_share_token on public.messages(share_token) where share_token is not null;
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_urls_message on public.urls(message_id);
create index idx_tags_message on public.tags(message_id);
create index idx_tags_name on public.tags(name);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.workspaces
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.channels
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.messages
  for each row execute function public.handle_updated_at();
