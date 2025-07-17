-- Add indexes for foreign keys to improve performance
CREATE INDEX IF NOT EXISTS bookings_service_id_idx ON bookings(service_id);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id);
CREATE INDEX IF NOT EXISTS conversations_booking_id_idx ON conversations(booking_id);
CREATE INDEX IF NOT EXISTS conversations_expert_id_idx ON conversations(expert_id);
CREATE INDEX IF NOT EXISTS expert_category_associations_category_id_idx ON expert_category_associations(category_id);
CREATE INDEX IF NOT EXISTS expert_services_expert_id_idx ON expert_services(expert_id);
CREATE INDEX IF NOT EXISTS expert_suggestions_submitted_by_idx ON expert_suggestions(submitted_by);
CREATE INDEX IF NOT EXISTS expert_videos_expert_id_idx ON expert_videos(expert_id);
CREATE INDEX IF NOT EXISTS invitations_invited_by_idx ON invitations(invited_by);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS reviews_booking_id_idx ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS reviews_expert_id_idx ON reviews(expert_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id); 