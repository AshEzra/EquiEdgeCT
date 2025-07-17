-- Migration: Add home_country field to profiles table for expert profiles
ALTER TABLE profiles ADD COLUMN home_country TEXT; 