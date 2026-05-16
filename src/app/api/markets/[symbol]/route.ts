import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { onyxFetch, getYesPrice } from "@/lib/onyx"

export const GET = async (_: NextRequest, { params }: { params: Promise<{ symbol: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { symbol } = await params
  const [market, prices] = await Promise.all([
    onyxFetch(`/markets/${symbol}`),
    onyxFetch(`/markets/${symbol}/prices`).catch(() => null),
  ])

  const yes_price = getYesPrice(market, prices)
  return NextResponse.json({
    ...market,
    yes_price,
    no_price: parseFloat((1 - yes_price).toFixed(4)),
    prices,
  })
}
