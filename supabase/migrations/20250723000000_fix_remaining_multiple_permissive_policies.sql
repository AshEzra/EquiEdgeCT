-- Fix remaining multiple permissive policies by removing redundant policies
-- This migration addresses the remaining "multiple_permissive_policies" warnings

-- Fix expert_category_associations table - remove redundant SELECT policy
-- We already have "Anyone can view expert categories and experts manage their own" which covers all SELECT cases
DROP POLICY IF EXISTS "Experts can manage their own category associations" ON "public"."expert_category_associations";

-- Recreate the management policy for experts (for INSERT, UPDATE, DELETE operations only)
CREATE POLICY "Experts can manage their own category associations" ON "public"."expert_category_associations"
FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_category_associations"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

CREATE POLICY "Experts can update their own category associations" ON "public"."expert_category_associations"
FOR UPDATE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_category_associations"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

CREATE POLICY "Experts can delete their own category associations" ON "public"."expert_category_associations"
FOR DELETE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_category_associations"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

-- Fix invitations table - remove redundant SELECT policy
-- We already have "Users can view their own invitations and admins can manage all" which covers all SELECT cases
DROP POLICY IF EXISTS "Admins can manage invitations" ON "public"."invitations";

-- Recreate the admin management policy for INSERT, UPDATE, DELETE operations (SELECT is covered by the combined policy)
CREATE POLICY "Admins can insert invitations" ON "public"."invitations"
FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."user_id" = (select auth.uid())) AND ("profiles"."email" = ANY (ARRAY['demo@equiedge.co'::"text", 'admin@equiedge.co'::"text"])))
    )
);

CREATE POLICY "Admins can update invitations" ON "public"."invitations"
FOR UPDATE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."user_id" = (select auth.uid())) AND ("profiles"."email" = ANY (ARRAY['demo@equiedge.co'::"text", 'admin@equiedge.co'::"text"])))
    )
);

CREATE POLICY "Admins can delete invitations" ON "public"."invitations"
FOR DELETE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."user_id" = (select auth.uid())) AND ("profiles"."email" = ANY (ARRAY['demo@equiedge.co'::"text", 'admin@equiedge.co'::"text"])))
    )
); 