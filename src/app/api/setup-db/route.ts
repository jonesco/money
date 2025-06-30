import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    console.log('Setup request received');
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, let's check if the table exists by trying to query it
    const { error: testError } = await supabase
      .from('watchlist')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      // Table doesn't exist, we need to create it
      console.log('Table does not exist, providing SQL to create it');
      
      return NextResponse.json({
        success: false,
        message: 'Table does not exist. Please run this SQL in your Supabase SQL Editor:',
        sql: `
-- Create the watchlist table with all required columns
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stock_symbol VARCHAR(10) NOT NULL,
  upper_threshold DECIMAL(10,2),
  lower_threshold DECIMAL(10,2),
  current_price DECIMAL(10,2),
  initial_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_stock_symbol ON watchlist(stock_symbol);
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
        `
      });
    }
    
    // Check if the last_updated column exists
    const { error: columnError } = await supabase
      .from('watchlist')
      .select('last_updated')
      .limit(1);
    
    if (columnError && columnError.code === '42703') {
      // Column doesn't exist, we need to add it
      console.log('last_updated column does not exist, providing SQL to add it');
      
      return NextResponse.json({
        success: false,
        message: 'last_updated column is missing. Please run this SQL in your Supabase SQL Editor:',
        sql: `
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
UPDATE watchlist SET last_updated = COALESCE(updated_at, created_at, NOW()) WHERE last_updated IS NULL;
        `
      });
    }
    
    // Everything looks good
    return NextResponse.json({
      success: true,
      message: 'Database setup is complete! Your watchlist table and last_updated column are ready.'
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      message: 'Setup failed. Please check your Supabase configuration.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 