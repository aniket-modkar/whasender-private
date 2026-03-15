-- Migration: Add media support to tasks
-- Created: 2025-01-XX

-- Add media columns to tasks table
ALTER TABLE tasks ADD COLUMN media_type TEXT DEFAULT 'text' CHECK(media_type IN ('text', 'video', 'image', 'document'));
ALTER TABLE tasks ADD COLUMN media_path TEXT;
ALTER TABLE tasks ADD COLUMN media_url TEXT;
ALTER TABLE tasks ADD COLUMN media_caption TEXT;
ALTER TABLE tasks ADD COLUMN media_size INTEGER; -- Size in bytes
ALTER TABLE tasks ADD COLUMN media_filename TEXT;
