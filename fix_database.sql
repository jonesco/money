-- Fix the watchlist table by adding the missing last_updated column
-- Run this in your Supabase SQL Editor

-- Add the last_updated column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watchlist' 
        AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create a trigger to automatically update last_updated on row changes
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_watchlist_last_updated ON watchlist;
CREATE TRIGGER update_watchlist_last_updated
    BEFORE UPDATE ON watchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- Update existing rows to have a last_updated value
UPDATE watchlist SET last_updated = COALESCE(updated_at, created_at, NOW()) WHERE last_updated IS NULL; 