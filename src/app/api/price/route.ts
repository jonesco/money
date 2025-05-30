import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { stockSymbol, watchlistId } = await request.json();
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not set" }, { status: 500 });
  }

  if (!stockSymbol || !watchlistId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Fetch price from Finnhub
  const url = `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
  const data = await res.json();
  const price = data.c; // 'c' is the current price

  // Update the watchlist item in the database
  const updated = await prisma.watchlist.update({
    where: { id: watchlistId },
    data: {
      currentPrice: price,
      lastUpdated: new Date(),
    },
  });

  return NextResponse.json({ price, updated });
}