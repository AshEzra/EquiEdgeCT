-- Migration: Create expert_videos table
CREATE TABLE IF NOT EXISTS expert_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
); 