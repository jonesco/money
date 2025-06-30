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
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const supabase = createSupabaseClientWithAuth(token);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
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
      .order('updated_at', { ascending: false });
    
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
  const auth = await getUserFromAuthHeader(request);
  if (!auth?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const supabase = createSupabaseClientWithAuth(auth.token);
  const body = await request.json();
  const { stockSymbol, upperThreshold, lowerThreshold, currentPrice, initialPrice } = body;
  if (!stockSymbol || upperThreshold === undefined || lowerThreshold === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  try {
    const { data: existingStock, error: checkError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', auth.user.id)
      .eq('stock_symbol', stockSymbol)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      if (checkError.code === '42703') {
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: checkError.message 
        }, { status: 500 });
      }
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (existingStock) {
      return NextResponse.json({ error: 'Stock already in watchlist' }, { status: 409 });
    }
    
    const { data: newStock, error } = await supabase
      .from('watchlist')
      .insert([{
        user_id: auth.user.id,
        stock_symbol: stockSymbol.toUpperCase(),
        upper_threshold: upperThreshold,
        lower_threshold: lowerThreshold,
        current_price: currentPrice || 0,
        initial_price: initialPrice || currentPrice || 0,
      }])
      .select()
      .single();
      
    if (error) {
      if (error.code === '42703') {
        return NextResponse.json({ 
          error: 'Database table not set up. Please run the setup script first.',
          details: error.message 
        }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(newStock);
  } catch (error) {
    console.error('POST: Error:', error);
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
  const { id, upperThreshold, lowerThreshold, currentPrice, initialPrice } = body;
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
  const auth = await getUserFromAuthHeader(request);
  if (!auth?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const supabase = createSupabaseClientWithAuth(auth.token);
  const body = await request.json();
  const { id } = body;
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