-- Add target_price column to watchlist table
-- Run this in your Supabase SQL editor

-- Add the target_price column
ALTER TABLE watchlist 
ADD COLUMN target_price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Update existing records to set target_price to initial_price
UPDATE watchlist 
SET target_price = initial_price 
WHERE target_price = 0; 