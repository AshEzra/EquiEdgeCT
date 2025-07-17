-- Add sort_order field to expert_categories table
ALTER TABLE public.expert_categories ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Update existing categories with default sort order
UPDATE public.expert_categories SET sort_order = 1 WHERE name = 'Showjumping';
UPDATE public.expert_categories SET sort_order = 2 WHERE name = 'Hunters';
UPDATE public.expert_categories SET sort_order = 3 WHERE name = 'Young Horse Development';
UPDATE public.expert_categories SET sort_order = 4 WHERE name = 'Rider Health & Mindset';
UPDATE public.expert_categories SET sort_order = 5 WHERE name = 'Horse Health & Peak Performance';
UPDATE public.expert_categories SET sort_order = 6 WHERE name = 'Equestrian Business & Career';
UPDATE public.expert_categories SET sort_order = 7 WHERE name = 'Training';
UPDATE public.expert_categories SET sort_order = 8 WHERE name = 'Competition';

-- Create expert_suggestions table
CREATE TABLE IF NOT EXISTS expert_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  reason text NOT NULL,
  submitted_by uuid REFERENCES profiles(id),
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
