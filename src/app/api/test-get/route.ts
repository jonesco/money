import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function createSupabaseClientWithAuth(token: string | null) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  });
}

export async function GET(request: Request) {
  try {
    console.log('Test GET: Starting...');
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    console.log('Test GET: Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth header' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    console.log('Test GET: Token length:', token.length);
    
    const supabase = createSupabaseClientWithAuth(token);
    console.log('Test GET: Supabase client created');
    
    // Test user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Test GET: User auth result:', userError ? 'Error' : 'Success');
    
    if (userError || !user) {
      console.error('Test GET: User auth error:', userError);
      return NextResponse.json({ error: 'User auth failed', details: userError }, { status: 401 });
    }
    
    console.log('Test GET: User ID:', user.id);
    
    // Test watchlist query
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('last_updated', { ascending: false });
    
    console.log('Test GET: Query completed');
    
    if (error) {
      console.error('Test GET: Query error:', error);
      return NextResponse.json({ error: 'Query failed', details: error }, { status: 500 });
    }
    
    console.log('Test GET: Success, data count:', data?.length || 0);
    return NextResponse.json({ 
      success: true, 
      user_id: user.id,
      data_count: data?.length || 0,
      data: data || []
    });
    
  } catch (error) {
    console.error('Test GET: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 