-- Users
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

-- Videos
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,
  title text not null,
  description text,
  tags text[] default '{}',
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Playlists
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Playlist <-> Videos (ordering supported)
create table public.playlist_videos (
  playlist_id uuid references public.playlists(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  position int not null default 1,
  added_by uuid references public.user_profiles(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (playlist_id, video_id)
);

-- Watch history
create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  playlist_id uuid references public.playlists(id) on delete set null,
  watched_seconds int not null default 0,
  completed boolean not null default false,
  last_watched_at timestamptz not null default now()
);

-- Notification queue
create table public.notification_queue (
  id bigserial primary key,
  user_id uuid references public.user_profiles(id) on delete cascade,
  playlist_id uuid references public.playlists(id) on delete set null,
  reason text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index on public.videos (created_at);
create index on public.playlists (created_at);
create index on public.playlist_videos (playlist_id, position);
create index on public.watch_history (user_id, last_watched_at);
create index on public.watch_history (playlist_id, completed);
create index on public.notification_queue (scheduled_for, sent_at);

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.videos enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_videos enable row level security;
alter table public.watch_history enable row level security;
alter table public.notification_queue enable row level security;

-- Helper: admin check
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- Policies
create policy "profiles self select" on public.user_profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles self update" on public.user_profiles
  for update using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "videos select all" on public.videos
  for select using (true);
create policy "videos admin write" on public.videos
  for all using (public.is_admin(auth.uid()));

create policy "playlists select all" on public.playlists
  for select using (true);
create policy "playlists admin write" on public.playlists
  for all using (public.is_admin(auth.uid()));

create policy "playlist_videos select all" on public.playlist_videos
  for select using (true);
create policy "playlist_videos admin write" on public.playlist_videos
  for all using (public.is_admin(auth.uid()));

create policy "watch_history select own" on public.watch_history
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "watch_history insert own" on public.watch_history
  for insert with check (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "watch_history update own" on public.watch_history
  for update using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "notification_queue service" on public.notification_queue
  for all using (auth.role() = 'service_role');

-- RPC to enqueue incomplete playlists
create or replace function public.collect_incomplete_playlists()
returns void language plpgsql security definer as $$
declare
  r record;
begin
  for r in
    select wh.user_id, wh.playlist_id
    from public.watch_history wh
    join public.playlist_videos pv on pv.playlist_id = wh.playlist_id
    group by wh.user_id, wh.playlist_id
    having bool_or(wh.completed) = false
  loop
    insert into public.notification_queue (user_id, playlist_id, reason, scheduled_for)
    values (r.user_id, r.playlist_id, 'incomplete_playlist', now())
    on conflict do nothing;
  end loop;
end;
$$;

