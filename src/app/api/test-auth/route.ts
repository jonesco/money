import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    console.log('Test Auth: Starting...');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Test Auth: Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No auth header',
        message: 'Please include Authorization: Bearer <token> header'
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    console.log('Test Auth: Token length:', token.length);
    console.log('Test Auth: Token preview:', token.substring(0, 20) + '...');
    
    // Create Supabase client with the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    console.log('Test Auth: Supabase client created');
    
    // Test user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Test Auth: User auth error:', userError);
      return NextResponse.json({ 
        error: 'User auth failed', 
        details: userError,
        message: 'Token validation failed'
      }, { status: 401 });
    }
    
    if (!user) {
      console.error('Test Auth: No user found');
      return NextResponse.json({ 
        error: 'No user found',
        message: 'Token is valid but no user associated'
      }, { status: 401 });
    }
    
    console.log('Test Auth: User authenticated successfully:', user.id);
    
    return NextResponse.json({ 
      success: true,
      user_id: user.id,
      email: user.email,
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('Test Auth: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Server error occurred'
    }, { status: 500 });
  }
} 