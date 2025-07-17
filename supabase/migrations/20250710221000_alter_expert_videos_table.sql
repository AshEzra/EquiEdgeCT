-- Migration: Alter expert_videos table to remove title and set expert_id NOT NULL
ALTER TABLE expert_videos DROP COLUMN IF EXISTS title;
ALTER TABLE expert_videos ALTER COLUMN expert_id SET NOT NULL; 