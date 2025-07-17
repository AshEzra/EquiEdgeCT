-- Fix multiple permissive policies by combining overlapping policies
-- This migration addresses "multiple_permissive_policies" warnings by combining policies for the same role/action

-- Fix bookings table - combine UPDATE policies
DROP POLICY IF EXISTS "Users and experts can update relevant bookings" ON "public"."bookings";
DROP POLICY IF EXISTS "Experts can complete their own sessions" ON "public"."bookings";

CREATE POLICY "Users and experts can update relevant bookings" ON "public"."bookings"
FOR UPDATE USING (
  (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."user_id") AND ("profiles"."user_id" = (select auth.uid()))))
    OR 
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."expert_id") AND ("profiles"."user_id" = (select auth.uid()))))
    OR
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
  )
);

-- Fix expert_category_associations table - combine SELECT policies
DROP POLICY IF EXISTS "Anyone can view expert categories" ON "public"."expert_category_associations";
DROP POLICY IF EXISTS "Experts can manage their own category associations" ON "public"."expert_category_associations";

CREATE POLICY "Anyone can view expert categories and experts manage their own" ON "public"."expert_category_associations"
FOR SELECT USING (
  true
  OR 
  EXISTS ( SELECT 1 FROM "public"."profiles"
    WHERE (("profiles"."id" = "expert_category_associations"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

-- Recreate the management policy for experts
CREATE POLICY "Experts can manage their own category associations" ON "public"."expert_category_associations"
FOR ALL USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_category_associations"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

-- Fix expert_services table - combine SELECT policies
DROP POLICY IF EXISTS "Anyone can view active services" ON "public"."expert_services";
DROP POLICY IF EXISTS "Experts can view their own services" ON "public"."expert_services";

CREATE POLICY "Anyone can view active services and experts their own" ON "public"."expert_services"
FOR SELECT USING (
  ("is_active" = true)
  OR 
  EXISTS ( SELECT 1 FROM "public"."profiles"
    WHERE (("profiles"."id" = "expert_services"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

-- Fix invitations table - combine SELECT policies
DROP POLICY IF EXISTS "Anyone can view their own invitation" ON "public"."invitations";
DROP POLICY IF EXISTS "Admins can manage invitations" ON "public"."invitations";

CREATE POLICY "Users can view their own invitations and admins can manage all" ON "public"."invitations"
FOR SELECT USING (
  (
    ("email" = (( SELECT "users"."email" FROM "auth"."users" WHERE ("users"."id" = (select auth.uid())))::"text"))
    OR 
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."user_id" = (select auth.uid())) AND ("profiles"."email" = ANY (ARRAY['demo@equiedge.co'::"text", 'admin@equiedge.co'::"text"])))
    )
  )
);

-- Recreate the admin management policy for ALL operations
CREATE POLICY "Admins can manage invitations" ON "public"."invitations"
FOR ALL USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."user_id" = (select auth.uid())) AND ("profiles"."email" = ANY (ARRAY['demo@equiedge.co'::"text", 'admin@equiedge.co'::"text"])))
    )
); 