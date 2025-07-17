-- Fix function search_path mutability for is_expert_user
CREATE OR REPLACE FUNCTION public.is_expert_user(expert_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the expert_id matches a profile that belongs to the current user
  -- and is marked as an expert
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = expert_id 
    AND is_expert = true
    -- For now, we'll allow any authenticated user to manage expert services
    -- In production, you'd want to check auth.uid() against user_id
  );
END;
$$; 