-- Add video_id to notification_queue for per-video reminders
alter table public.notification_queue
  add column if not exists video_id uuid references public.videos(id) on delete cascade;

-- Allow authenticated users to insert their own reminders
create policy "notification_queue user insert"
  on public.notification_queue
  for insert
  with check (auth.uid() = user_id);

-- Helper to enqueue a reminder for a specific video
create or replace function public.enqueue_video_reminder(video_id uuid, scheduled_at timestamptz)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.notification_queue (user_id, video_id, reason, scheduled_for)
  values (auth.uid(), enqueue_video_reminder.video_id, 'video_reminder', scheduled_at);
end;
$$;

