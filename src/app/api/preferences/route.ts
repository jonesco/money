import { NextRequest, NextResponse } from 'next/server';
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

const getUserFromAuthHeader = async (request: NextRequest) => {
  console.log('=== getUserFromAuthHeader START ===');
  
  const authHeader = request.headers.get('authorization');
  console.log('Auth header present:', !!authHeader);
  console.log('Auth header starts with Bearer:', authHeader?.startsWith('Bearer '));
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid auth header format');
    return null;
  }
  
  const token = authHeader.substring(7);
  console.log('Token extracted, length:', token.length);
  console.log('Token preview:', token.substring(0, 20) + '...');
  
  const supabase = createSupabaseClientWithAuth(token);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  console.log('getUser result:', {
    hasUser: !!user,
    userId: user?.id,
    hasError: !!error,
    errorMessage: error?.message
  });
  
  if (error || !user) {
    console.log('getUser failed:', error?.message);
    return null;
  }
  
  console.log('getUserFromAuthHeader success for user:', user.id);
  return { user, token };
};

// GET - Retrieve user preferences
export async function GET(request: NextRequest) {
  console.log('=== GET /api/preferences START ===');
  
  const auth = await getUserFromAuthHeader(request);
  console.log('GET: Auth result:', {
    hasAuth: !!auth,
    hasUser: !!auth?.user,
    userId: auth?.user?.id,
    hasToken: !!auth?.token
  });
  
  if (!auth?.user) {
    console.log('GET: Authentication failed - no user');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  console.log('GET: User authenticated:', auth.user.id);
  
  const supabase = createSupabaseClientWithAuth(auth.token);
  
  try {
    console.log('GET: Fetching user preferences...');
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', auth.user.id)
      .single();
    
    console.log('GET: Preferences query result:', {
      hasPreferences: !!preferences,
      error: error?.message,
      errorCode: error?.code
    });
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, create default ones
        console.log('GET: No preferences found, creating defaults...');
        const { data: newPreferences, error: insertError } = await supabase
          .from('user_preferences')
          .insert([{
            user_id: auth.user.id,
            default_high_percentage: 10.00,
            default_low_percentage: -10.00,
          }])
          .select()
          .single();
        
        if (insertError) {
          console.log('GET: Insert error:', insertError.message);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        
        console.log('GET: Default preferences created:', newPreferences);
        return NextResponse.json(newPreferences);
      }
      
      if (error.code === '42703') {
        console.log('GET: Database table not set up');
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: error.message 
        }, { status: 500 });
      }
      
      console.log('GET: Query error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('GET: Success, returning preferences:', preferences);
    return NextResponse.json(preferences);
    
  } catch (error) {
    console.error('GET: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user preferences
export async function PUT(request: NextRequest) {
  console.log('=== PUT /api/preferences START ===');
  
  const auth = await getUserFromAuthHeader(request);
  console.log('PUT: Auth result:', {
    hasAuth: !!auth,
    hasUser: !!auth?.user,
    userId: auth?.user?.id,
    hasToken: !!auth?.token
  });
  
  if (!auth?.user) {
    console.log('PUT: Authentication failed - no user');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  console.log('PUT: User authenticated:', auth.user.id);
  
  const supabase = createSupabaseClientWithAuth(auth.token);
  const body = await request.json();
  console.log('PUT: Request body:', body);
  
  const { defaultHighPercentage, defaultLowPercentage } = body;
  
  if (defaultHighPercentage === undefined || defaultLowPercentage === undefined) {
    console.log('PUT: Missing required fields');
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // Validate percentages
  if (typeof defaultHighPercentage !== 'number' || typeof defaultLowPercentage !== 'number') {
    console.log('PUT: Invalid percentage values');
    return NextResponse.json({ error: 'Invalid percentage values' }, { status: 400 });
  }
  
  if (defaultHighPercentage <= defaultLowPercentage) {
    console.log('PUT: High percentage must be greater than low percentage');
    return NextResponse.json({ error: 'High percentage must be greater than low percentage' }, { status: 400 });
  }
  
  try {
    console.log('PUT: Checking for existing preferences...');
    const { data: existingPreferences, error: checkError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', auth.user.id)
      .single();
    
    console.log('PUT: Existing preferences check result:', {
      hasExistingPreferences: !!existingPreferences,
      checkError: checkError?.message,
      errorCode: checkError?.code
    });
    
    let result;
    
    if (checkError && checkError.code === 'PGRST116') {
      // No preferences exist, create new ones
      console.log('PUT: Creating new preferences...');
      const { data: newPreferences, error: insertError } = await supabase
        .from('user_preferences')
        .insert([{
          user_id: auth.user.id,
          default_high_percentage: defaultHighPercentage,
          default_low_percentage: defaultLowPercentage,
        }])
        .select()
        .single();
      
      if (insertError) {
        console.log('PUT: Insert error:', insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      
      result = newPreferences;
    } else if (checkError) {
      if (checkError.code === '42703') {
        console.log('PUT: Database table not set up');
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: checkError.message 
        }, { status: 500 });
      }
      console.log('PUT: Check error:', checkError.message);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    } else {
      // Preferences exist, update them
      console.log('PUT: Updating existing preferences...');
      const { data: updatedPreferences, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          default_high_percentage: defaultHighPercentage,
          default_low_percentage: defaultLowPercentage,
        })
        .eq('user_id', auth.user.id)
        .select()
        .single();
      
      if (updateError) {
        console.log('PUT: Update error:', updateError.message);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      result = updatedPreferences;
    }
    
    console.log('PUT: Success, returning updated preferences:', result);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('PUT: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 