-- Create the watchlist table in Supabase
-- Run this in your Supabase SQL editor

-- Drop the table if it exists (be careful with this in production)
DROP TABLE IF EXISTS watchlist;

-- Create the watchlist table with snake_case field names
CREATE TABLE watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stock_symbol TEXT NOT NULL,
    upper_threshold DECIMAL(10,2) NOT NULL,
    lower_threshold DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    initial_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_stock_symbol ON watchlist(stock_symbol);
CREATE INDEX idx_watchlist_last_updated ON watchlist(last_updated);

-- Enable Row Level Security (RLS)
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own watchlist items
CREATE POLICY "Users can view own watchlist" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own watchlist items
CREATE POLICY "Users can insert own watchlist" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own watchlist items
CREATE POLICY "Users can update own watchlist" ON watchlist
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own watchlist items
CREATE POLICY "Users can delete own watchlist" ON watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update last_updated
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update last_updated
CREATE TRIGGER update_watchlist_last_updated
    BEFORE UPDATE ON watchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated(); 