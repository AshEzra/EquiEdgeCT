create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";


drop policy "Users can insert their own profile" on "public"."profiles";

drop policy "Users can update their own profile" on "public"."profiles";

alter table "public"."expert_suggestions" enable row level security;

alter table "public"."expert_videos" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.complete_expert_session(booking_uuid uuid, expert_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
BEGIN
  -- Get booking and service details
  SELECT b.*, es.service_type INTO booking_record
  FROM public.bookings b
  JOIN public.expert_services es ON b.service_id = es.id
  WHERE b.id = booking_uuid;
  
  -- Only allow manual completion for 30_min and 1_hour sessions
  IF booking_record.service_type NOT IN ('30_min', '1_hour') THEN
    RETURN FALSE;
  END IF;
  
  -- Mark session as completed (uses existing updated_at field)
  UPDATE public.bookings 
  SET 
    status = 'completed',
    chat_enabled = false,
    notes = expert_notes
  WHERE id = booking_uuid;
  
  -- Lock the conversation
  UPDATE public.conversations 
  SET status = 'locked'
  WHERE booking_id = booking_uuid;
  
  RETURN TRUE;
END;
$function$
;

create policy "Anyone can view all expert videos"
on "public"."expert_videos"
as permissive
for select
to public
using (true);


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((user_id = ( SELECT auth.uid() AS uid)));



