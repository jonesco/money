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

// GET - Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromAuthHeader(request);
    if (!auth?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    
    console.log('GET: User authenticated:', auth.user.id);
    
    const supabase = createSupabaseClientWithAuth(auth.token);
    console.log('GET: Supabase client created with token');
    
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('stock_symbol', { ascending: true });
    
    console.log('GET: Supabase query completed');
    
    if (error) {
      console.error('GET: Supabase error:', error);
      if (error.code === '42703') {
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: error.message 
        }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('GET: Success, returning data:', data);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch watchlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add new stock to watchlist
export async function POST(request: NextRequest) {
  console.log('=== POST /api/watchlist START ===');
  
  const auth = await getUserFromAuthHeader(request);
  console.log('POST: Auth result:', {
    hasAuth: !!auth,
    hasUser: !!auth?.user,
    userId: auth?.user?.id,
    hasToken: !!auth?.token
  });
  
  if (!auth?.user) {
    console.log('POST: Authentication failed - no user');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  console.log('POST: User authenticated:', auth.user.id);
  
  const supabase = createSupabaseClientWithAuth(auth.token);
  const body = await request.json();
  console.log('POST: Request body:', body);
  
  const { stockSymbol, upperThreshold, lowerThreshold, currentPrice, initialPrice, targetPrice } = body;
  if (!stockSymbol || upperThreshold === undefined || lowerThreshold === undefined) {
    console.log('POST: Missing required fields');
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  try {
    console.log('POST: Checking for existing stock...');
    const { data: existingStock, error: checkError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', auth.user.id)
      .eq('stock_symbol', stockSymbol)
      .single();
    
    console.log('POST: Existing stock check result:', {
      hasExistingStock: !!existingStock,
      checkError: checkError?.message,
      errorCode: checkError?.code
    });
    
    if (checkError && checkError.code !== 'PGRST116') {
      if (checkError.code === '42703') {
        console.log('POST: Database table not set up');
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: checkError.message 
        }, { status: 500 });
      }
      console.log('POST: Check error:', checkError.message);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (existingStock) {
      console.log('POST: Stock already exists');
      return NextResponse.json({ error: 'Stock already in watchlist' }, { status: 409 });
    }
    
    console.log('POST: Inserting new stock...');
    const { data: newStock, error } = await supabase
      .from('watchlist')
      .insert([{
        user_id: auth.user.id,
        stock_symbol: stockSymbol.toUpperCase(),
        upper_threshold: upperThreshold,
        lower_threshold: lowerThreshold,
        current_price: currentPrice || 0,
        initial_price: initialPrice || currentPrice || 0,
        target_price: targetPrice || initialPrice || currentPrice || 0,
      }])
      .select()
      .single();
      
    console.log('POST: Insert result:', {
      hasNewStock: !!newStock,
      error: error?.message,
      errorCode: error?.code
    });
      
    if (error) {
      if (error.code === '42703') {
        console.log('POST: Database table not set up during insert');
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: error.message 
        }, { status: 500 });
      }
      console.log('POST: Insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('POST: Success, returning new stock:', newStock);
    return NextResponse.json(newStock);
  } catch (error) {
    console.error('POST: Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to add stock' }, { status: 500 });
  }
}

// PUT - Update stock in watchlist
export async function PUT(request: NextRequest) {
  console.log('PUT: Update request received');
  const auth = await getUserFromAuthHeader(request);
  if (!auth?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const supabase = createSupabaseClientWithAuth(auth.token);
  const body = await request.json();
  console.log('PUT: Request body:', body);
  const { id, upperThreshold, lowerThreshold, currentPrice, initialPrice, targetPrice } = body;
  if (!id) {
    return NextResponse.json({ error: 'Stock ID is required' }, { status: 400 });
  }
  
  try {
    const { data: existingStock, error: checkError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .single();
      
    if (checkError) {
      if (checkError.code === '42703') {
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: checkError.message 
        }, { status: 500 });
      }
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (!existingStock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }
    
    console.log('PUT: Existing stock:', existingStock);
    
    const updateData = {
      upper_threshold: upperThreshold,
      lower_threshold: lowerThreshold,
      current_price: currentPrice,
      initial_price: initialPrice,
      target_price: targetPrice,
    };
    console.log('PUT: Update data:', updateData);
    
    const { data: updatedStock, error } = await supabase
      .from('watchlist')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      if (error.code === '42703') {
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: error.message 
        }, { status: 500 });
      }
      console.error('PUT: Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('PUT: Updated stock:', updatedStock);
    return NextResponse.json(updatedStock);
  } catch (error) {
    console.error('PUT: Error:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}

// DELETE - Remove stock from watchlist
export async function DELETE(request: NextRequest) {
  console.log('DELETE: Delete request received');
  const auth = await getUserFromAuthHeader(request);
  if (!auth?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const supabase = createSupabaseClientWithAuth(auth.token);
  
  // Get ID from query parameters
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  console.log('DELETE: Stock ID from query params:', id);
  
  if (!id) {
    return NextResponse.json({ error: 'Stock ID is required' }, { status: 400 });
  }
  
  try {
    const { data: existingStock, error: checkError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .single();
      
    if (checkError) {
      if (checkError.code === '42703') {
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: checkError.message 
        }, { status: 500 });
      }
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (!existingStock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }
    
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);
      
    if (error) {
      if (error.code === '42703') {
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: error.message 
        }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Stock removed from watchlist' });
  } catch (error) {
    console.error('DELETE: Error:', error);
    return NextResponse.json({ error: 'Failed to delete stock' }, { status: 500 });
  }
}