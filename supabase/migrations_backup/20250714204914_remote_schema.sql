drop policy "Experts can manage their own services" on "public"."expert_services";

drop function if exists "public"."check_invitation"(email_address text);

drop index if exists "public"."bookings_service_id_idx";

drop index if exists "public"."bookings_user_id_idx";

drop index if exists "public"."conversations_booking_id_idx";

drop index if exists "public"."conversations_expert_id_idx";

drop index if exists "public"."expert_category_associations_category_id_idx";

drop index if exists "public"."expert_services_expert_id_idx";

drop index if exists "public"."expert_suggestions_submitted_by_idx";

drop index if exists "public"."expert_videos_expert_id_idx";

drop index if exists "public"."invitations_invited_by_idx";

drop index if exists "public"."messages_conversation_id_idx";

drop index if exists "public"."messages_sender_id_idx";

drop index if exists "public"."reviews_booking_id_idx";

drop index if exists "public"."reviews_expert_id_idx";

drop index if exists "public"."reviews_user_id_idx";

alter table "public"."expert_categories" alter column "sort_order" drop default;

alter table "public"."expert_categories" alter column "sort_order" set data type smallint using "sort_order"::smallint;

alter table "public"."profiles" drop column "home_country";

alter table "public"."profiles" add column "expert_rank" integer;

CREATE INDEX bookings_expert_id_idx ON public.bookings USING btree (expert_id);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_expert_user(expert_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

create policy "Experts can delete their own services"
on "public"."expert_services"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = expert_services.expert_id) AND (profiles.user_id = auth.uid()) AND (profiles.is_expert = true)))));


create policy "Experts can insert their own services"
on "public"."expert_services"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = expert_services.expert_id) AND (profiles.user_id = auth.uid()) AND (profiles.is_expert = true)))));


create policy "Experts can update their own services"
on "public"."expert_services"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = expert_services.expert_id) AND (profiles.user_id = auth.uid()) AND (profiles.is_expert = true)))));


create policy "Experts can view their own services"
on "public"."expert_services"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = expert_services.expert_id) AND (profiles.user_id = auth.uid()) AND (profiles.is_expert = true)))));



