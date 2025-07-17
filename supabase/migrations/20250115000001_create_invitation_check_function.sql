-- Create a function to check if an email has a valid invitation
-- This function runs with SECURITY DEFINER, so it bypasses RLS
CREATE OR REPLACE FUNCTION public.check_invitation(email_address TEXT)
RETURNS TABLE(
  has_invitation BOOLEAN,
  invitation_status TEXT,
  invitation_role TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as has_invitation,
    i.status as invitation_status,
    i.role as invitation_role
  FROM public.invitations i
  WHERE i.email = email_address
  LIMIT 1;
  
  -- If no invitation found, return FALSE
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_invitation(TEXT) TO authenticated; 