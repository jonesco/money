import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Setup request received');
    
    // Provide only the SQL commands without explanatory text
    const sqlCommands = `-- Create the watchlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_symbol TEXT NOT NULL,
  upper_threshold DECIMAL(10,2) NOT NULL,
  lower_threshold DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  initial_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'watchlist' AND column_name = 'last_updated') THEN
    ALTER TABLE watchlist ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_stock_symbol ON watchlist(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_watchlist_last_updated ON watchlist(last_updated);

-- Enable Row Level Security
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'Users can view their own watchlist') THEN
    CREATE POLICY "Users can view their own watchlist" ON watchlist
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'Users can insert their own watchlist items') THEN
    CREATE POLICY "Users can insert their own watchlist items" ON watchlist
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'Users can update their own watchlist items') THEN
    CREATE POLICY "Users can update their own watchlist items" ON watchlist
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'Users can delete their own watchlist items') THEN
    CREATE POLICY "Users can delete their own watchlist items" ON watchlist
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;`;

    console.log('Returning SQL commands');
    return NextResponse.json({ sql: sqlCommands });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Failed to generate setup SQL' }, { status: 500 });
  }
} 