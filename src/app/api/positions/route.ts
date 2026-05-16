import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { positions, orders } from "@/db/schema"
import { eq } from "drizzle-orm"
import { onyxFetch, getYesPrice } from "@/lib/onyx"

export const GET = async () => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userPositions = await db
    .select()
    .from(positions)
    .where(eq(positions.user_id, session.user.id))

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.user_id, session.user.id))
    .orderBy(orders.created_at)

  const positionsWithPnl = await Promise.all(
    userPositions.map(async (pos) => {
      let current_price = parseFloat(pos.avg_fill_price)
      try {
        const [market, prices] = await Promise.all([
          onyxFetch(`/markets/${pos.symbol}`),
          onyxFetch(`/markets/${pos.symbol}/prices`).catch(() => null),
        ])
        current_price = getYesPrice(market, prices)
      } catch {
        // fall back to avg fill price so P&L shows 0
      }

      const avg = parseFloat(pos.avg_fill_price)
      const qty = parseFloat(pos.quantity)
      const unrealized_pnl =
        pos.side === "YES" ? (current_price - avg) * qty : (1 - current_price - avg) * qty

      return {
        ...pos,
        current_price,
        unrealized_pnl: parseFloat(unrealized_pnl.toFixed(2)),
      }
    })
  )

  return NextResponse.json({ positions: positionsWithPnl, orders: userOrders })
}
