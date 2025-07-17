-- Fix RLS policy for invitations table to allow checking any invitation during login
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invitations'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view their own invitation" ON public.invitations;
    CREATE POLICY "Allow checking invitations"
    ON public.invitations
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Keep the admin policy for managing invitations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invitations'
  ) THEN
    CREATE POLICY "Admins can manage invitations"
    ON public.invitations
    FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.email IN ('demo@equiedge.co', 'admin@equiedge.co')
    ));
  END IF;
END $$; 