import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { onyxFetch, getYesPrice, OnyxMarket } from "@/lib/onyx"

export const GET = async () => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await onyxFetch("/markets")
  const markets = (Array.isArray(data) ? data : (data.markets ?? [])).map((m: OnyxMarket) => {
    const yes_price = getYesPrice(m)
    return { ...m, yes_price, no_price: parseFloat((1 - yes_price).toFixed(4)) }
  })

  return NextResponse.json({ markets })
}
