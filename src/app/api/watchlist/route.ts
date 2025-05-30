import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const watchlist = await prisma.watchlist.findMany();
  return NextResponse.json(watchlist);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stockSymbol, upperThreshold, lowerThreshold } = await request.json();

  if (!stockSymbol || upperThreshold == null || lowerThreshold == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newStock = await prisma.watchlist.create({
    data: {
      userId: user.id,
      stockSymbol,
      upperThreshold,
      lowerThreshold,
      currentPrice: 0, // Will update with real price later
    },
  });

  return NextResponse.json(newStock, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing stock id" }, { status: 400 });
  }

  await prisma.watchlist.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Stock removed" });
}