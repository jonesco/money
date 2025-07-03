import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not set' }, { status: 500 });
  }

  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    );

    const data = response.data;
    
    if (!data || !data.c) {
      return NextResponse.json({ error: 'No data found for symbol' }, { status: 404 });
    }

    // Fetch company name from Finnhub profile endpoint
    let companyName = symbol;
    try {
      const profileResponse = await axios.get(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
      );
      if (profileResponse.data && profileResponse.data.name) {
        companyName = profileResponse.data.name;
      }
    } catch (profileError) {
      // If profile fetch fails, fallback to symbol
      companyName = symbol;
    }

    // Calculate percentage change
    const changePercent = ((data.dp / data.pc) * 100).toFixed(2);

    return NextResponse.json({
      symbol: symbol,
      price: data.c,
      change: data.d,
      changePercent: changePercent,
      volume: data.t,
      latestTradingDay: new Date().toISOString().split('T')[0],
      companyName,
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
} 