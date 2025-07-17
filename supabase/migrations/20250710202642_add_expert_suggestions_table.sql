-- Create expert_suggestions table
CREATE TABLE IF NOT EXISTS expert_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  reason text NOT NULL,
  submitted_by uuid REFERENCES profiles(id),
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
