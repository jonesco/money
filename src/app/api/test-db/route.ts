import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: Check if we can connect
    console.log('Testing Supabase connection...');
    
    // Test 2: Try to get table info
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log('Tables error:', tablesError);
    console.log('Tables:', tables);
    
    // Test 3: Try to query the watchlist table
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlist')
      .select('*')
      .limit(5);
    
    console.log('Watchlist error:', watchlistError);
    console.log('Watchlist data:', watchlistData);
    
    return NextResponse.json({
      connection: 'success',
      tables: tables || [],
      tablesError: tablesError?.message,
      watchlistData: watchlistData || [],
      watchlistError: watchlistError?.message,
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 