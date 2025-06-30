-- Fix the watchlist table by adding the missing last_updated column
-- Run this in your Supabase SQL Editor

-- Add the missing last_updated column
ALTER TABLE watchlist 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_watchlist_last_updated ON watchlist(last_updated);

-- Create a function to automatically update last_updated
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update last_updated
DROP TRIGGER IF EXISTS update_watchlist_last_updated ON watchlist;
CREATE TRIGGER update_watchlist_last_updated
    BEFORE UPDATE ON watchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();

-- Update existing records to have a last_updated value
UPDATE watchlist 
SET last_updated = created_at 
WHERE last_updated IS NULL; 