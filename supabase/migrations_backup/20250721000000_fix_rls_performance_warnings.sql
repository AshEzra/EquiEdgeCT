-- Fix RLS performance warnings by optimizing auth function calls
-- This migration addresses "auth_rls_initplan" warnings by replacing auth.uid() with (select auth.uid())

-- Fix bookings table policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON "public"."bookings";
CREATE POLICY "Users can view their own bookings" ON "public"."bookings"
FOR SELECT USING (
  (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."user_id") AND ("profiles"."user_id" = (select auth.uid()))))
    OR 
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."expert_id") AND ("profiles"."user_id" = (select auth.uid()))))
  )
);

DROP POLICY IF EXISTS "Users can create bookings for themselves" ON "public"."bookings";
CREATE POLICY "Users can create bookings for themselves" ON "public"."bookings"
FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."user_id") AND ("profiles"."user_id" = (select auth.uid()))))
);

DROP POLICY IF EXISTS "Users and experts can update relevant bookings" ON "public"."bookings";
CREATE POLICY "Users and experts can update relevant bookings" ON "public"."bookings"
FOR UPDATE USING (
  (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."user_id") AND ("profiles"."user_id" = (select auth.uid()))))
    OR 
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."expert_id") AND ("profiles"."user_id" = (select auth.uid()))))
  )
);

DROP POLICY IF EXISTS "Experts can complete their own sessions" ON "public"."bookings";
CREATE POLICY "Experts can complete their own sessions" ON "public"."bookings"
FOR UPDATE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "bookings"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true))
    )
);

-- Fix invitations table policies
DROP POLICY IF EXISTS "Anyone can view their own invitation" ON "public"."invitations";
CREATE POLICY "Anyone can view their own invitation" ON "public"."invitations"
FOR SELECT USING (
    "email" = (( SELECT "users"."email" FROM "auth"."users" WHERE ("users"."id" = (select auth.uid())))::"text")
);

DROP POLICY IF EXISTS "Admins can manage invitations" ON "public"."invitations";
CREATE POLICY "Admins can manage invitations" ON "public"."invitations"
FOR ALL USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."user_id" = (select auth.uid())) AND ("profiles"."email" = ANY (ARRAY['demo@equiedge.co'::"text", 'admin@equiedge.co'::"text"])))
    )
);

-- Fix conversations table policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON "public"."conversations";
CREATE POLICY "Users can view their own conversations" ON "public"."conversations"
FOR SELECT USING (
  (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "conversations"."user_id") AND ("profiles"."user_id" = (select auth.uid()))))
    OR 
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "conversations"."expert_id") AND ("profiles"."user_id" = (select auth.uid()))))
  )
);

DROP POLICY IF EXISTS "Users can create conversations" ON "public"."conversations";
CREATE POLICY "Users can create conversations" ON "public"."conversations"
FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "conversations"."user_id") AND ("profiles"."user_id" = (select auth.uid()))))
);

DROP POLICY IF EXISTS "Participants can update conversations" ON "public"."conversations";
CREATE POLICY "Participants can update conversations" ON "public"."conversations"
FOR UPDATE USING (
  (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "conversations"."user_id") AND ("profiles"."user_id" = (select auth.uid()))))
    OR 
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "conversations"."expert_id") AND ("profiles"."user_id" = (select auth.uid()))))
  )
);

-- Fix messages table policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON "public"."messages";
CREATE POLICY "Users can view messages in their conversations" ON "public"."messages"
FOR SELECT USING (
    EXISTS ( SELECT 1 FROM ("public"."conversations" JOIN "public"."profiles" ON (("profiles"."id" = "conversations"."user_id") OR ("profiles"."id" = "conversations"."expert_id")))
      WHERE (("conversations"."id" = "messages"."conversation_id") AND ("profiles"."user_id" = (select auth.uid()))))
);

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON "public"."messages";
CREATE POLICY "Users can send messages in their conversations" ON "public"."messages"
FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM ("public"."conversations" JOIN "public"."profiles" ON (("profiles"."id" = "conversations"."user_id") OR ("profiles"."id" = "conversations"."expert_id")))
      WHERE (("conversations"."id" = "messages"."conversation_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."id" = "messages"."sender_id")))
);

DROP POLICY IF EXISTS "Users can update their own messages" ON "public"."messages";
CREATE POLICY "Users can update their own messages" ON "public"."messages"
FOR UPDATE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "messages"."sender_id") AND ("profiles"."user_id" = (select auth.uid()))))
);

-- Fix reviews table policies
DROP POLICY IF EXISTS "Users can create reviews for their completed bookings" ON "public"."reviews";
CREATE POLICY "Users can create reviews for their completed bookings" ON "public"."reviews"
FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM ("public"."bookings" "b" JOIN "public"."profiles" "p" ON (("p"."id" = "b"."user_id")))
      WHERE (("b"."id" = "reviews"."booking_id") AND ("b"."expert_id" = "reviews"."expert_id") AND ("b"."user_id" = "reviews"."user_id") AND ("p"."user_id" = (select auth.uid())) AND ("b"."status" = 'completed'::"text")))
);

DROP POLICY IF EXISTS "Users can update their own reviews" ON "public"."reviews";
CREATE POLICY "Users can update their own reviews" ON "public"."reviews"
FOR UPDATE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles" "p"
      WHERE (("p"."id" = "reviews"."user_id") AND ("p"."user_id" = (select auth.uid()))))
);

-- Fix expert_services table policies
DROP POLICY IF EXISTS "Experts can view their own services" ON "public"."expert_services";
CREATE POLICY "Experts can view their own services" ON "public"."expert_services"
FOR SELECT USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_services"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

DROP POLICY IF EXISTS "Experts can insert their own services" ON "public"."expert_services";
CREATE POLICY "Experts can insert their own services" ON "public"."expert_services"
FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_services"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

DROP POLICY IF EXISTS "Experts can update their own services" ON "public"."expert_services";
CREATE POLICY "Experts can update their own services" ON "public"."expert_services"
FOR UPDATE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_services"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

DROP POLICY IF EXISTS "Experts can delete their own services" ON "public"."expert_services";
CREATE POLICY "Experts can delete their own services" ON "public"."expert_services"
FOR DELETE USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_services"."expert_id") AND ("profiles"."user_id" = (select auth.uid())) AND ("profiles"."is_expert" = true)))
);

-- Fix expert_suggestions table policies
DROP POLICY IF EXISTS "Authenticated can insert suggestions" ON "public"."expert_suggestions";
CREATE POLICY "Authenticated can insert suggestions" ON "public"."expert_suggestions"
FOR INSERT WITH CHECK (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_suggestions"."submitted_by") AND ("profiles"."user_id" = (select auth.uid()))))
);

DROP POLICY IF EXISTS "Users can view their own suggestions" ON "public"."expert_suggestions";
CREATE POLICY "Users can view their own suggestions" ON "public"."expert_suggestions"
FOR SELECT USING (
    EXISTS ( SELECT 1 FROM "public"."profiles"
      WHERE (("profiles"."id" = "expert_suggestions"."submitted_by") AND ("profiles"."user_id" = (select auth.uid()))))
); 