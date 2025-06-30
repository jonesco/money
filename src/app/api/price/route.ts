import { NextResponse } from "next/server";

export async function GET() {
  // Return mock price data for now
  return NextResponse.json({
    symbol: "AAPL",
    price: 175.50,
    change: 1.23,
    changePercent: "0.71%",
    volume: 1000000,
    latestTradingDay: new Date().toISOString().split('T')[0],
    companyName: "Apple Inc."
  });
}