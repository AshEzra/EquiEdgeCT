-- Migration: Add profile_bio field to profiles table for detailed expert profile bio
ALTER TABLE profiles ADD COLUMN profile_bio text; 