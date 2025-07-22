-- Migration: Allow experts to insert, update, and delete their own videos
-- These policies allow insert, update, and delete on expert_videos if the expert_id matches a profile owned by the current user

create policy "Experts can insert their own videos"
on expert_videos
for insert
with check (
  exists (
    select 1 from profiles
    where profiles.id = expert_videos.expert_id
    and profiles.user_id = (select auth.uid())
  )
);

create policy "Experts can update their own videos"
on expert_videos
for update
using (
  exists (
    select 1 from profiles
    where profiles.id = expert_videos.expert_id
    and profiles.user_id = (select auth.uid())
  )
);

create policy "Experts can delete their own videos"
on expert_videos
for delete
using (
  exists (
    select 1 from profiles
    where profiles.id = expert_videos.expert_id
    and profiles.user_id = (select auth.uid())
  )
); 