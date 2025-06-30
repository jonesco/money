import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('Setup request received');
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, let's check if the table exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('watchlist')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      // Table doesn't exist, we need to create it
      console.log('Table does not exist, creating...');
      
      // For now, let's return the SQL that needs to be run manually
      // since Supabase client doesn't support DDL operations directly
      const setupSQL = `
-- Run this in your Supabase SQL editor:

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
CREATE POLICY "Users can view own watchlist" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist" ON watchlist
    FOR UPDATE USING (auth.uid() = user_id);

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
      `;
      
      return NextResponse.json({ 
        message: 'Table does not exist. Please run the following SQL in your Supabase SQL editor:',
        sql: setupSQL,
        instructions: 'Go to your Supabase dashboard > SQL Editor and run the SQL above'
      });
    } else if (testError) {
      // Some other error
      console.error('Test query error:', testError);
      return NextResponse.json({ 
        error: 'Database error',
        details: testError.message 
      }, { status: 500 });
    } else {
      // Table exists, let's check if it has the required columns
      console.log('Table exists, checking columns...');
      
      // Try to query with the last_updated column to see if it exists
      const { data: columnTest, error: columnError } = await supabase
        .from('watchlist')
        .select('id, last_updated')
        .limit(1);
      
      if (columnError && columnError.code === '42703') {
        // last_updated column doesn't exist
        const alterSQL = `
-- Run this in your Supabase SQL editor to add the missing column:

ALTER TABLE watchlist 
ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for the new column
CREATE INDEX idx_watchlist_last_updated ON watchlist(last_updated);

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
        `;
        
        return NextResponse.json({ 
          message: 'Table exists but missing last_updated column. Please run the following SQL in your Supabase SQL editor:',
          sql: alterSQL,
          instructions: 'Go to your Supabase dashboard > SQL Editor and run the SQL above'
        });
      } else if (columnError) {
        return NextResponse.json({ 
          error: 'Column check error',
          details: columnError.message 
        }, { status: 500 });
      } else {
        return NextResponse.json({ 
          message: 'Database table is properly set up and ready to use!',
          status: 'ready'
        });
      }
    }
    
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 