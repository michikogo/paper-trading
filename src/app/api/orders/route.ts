import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users, orders, positions } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { onyxFetch, getYesPrice } from "@/lib/onyx"

export const POST = async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { symbol, market_name, side, quantity } = await req.json()

  if (!symbol || !market_name || !side || !quantity || quantity <= 0) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 })
  }

  let fill_price: number
  try {
    const [market, prices] = await Promise.all([
      onyxFetch(`/markets/${symbol}`),
      onyxFetch(`/markets/${symbol}/prices`).catch(() => null),
    ])
    const yes_price = getYesPrice(market, prices)
    fill_price = side === "YES" ? yes_price : parseFloat((1 - yes_price).toFixed(4))
  } catch {
    return NextResponse.json({ error: "Failed to fetch current price" }, { status: 502 })
  }

  const total_cost = parseFloat((quantity * fill_price).toFixed(2))

  try {
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)

    if (!user || parseFloat(user.balance) < total_cost) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 402 })
    }

    const [existingPosition] = await db
      .select()
      .from(positions)
      .where(
        and(
          eq(positions.user_id, session.user.id),
          eq(positions.symbol, symbol),
          eq(positions.side, side)
        )
      )
      .limit(1)

    let new_qty: number
    let new_avg: number

    if (existingPosition) {
      const old_qty = parseFloat(existingPosition.quantity)
      const old_avg = parseFloat(existingPosition.avg_fill_price)
      new_qty = old_qty + quantity
      new_avg = (old_avg * old_qty + fill_price * quantity) / new_qty
    } else {
      new_qty = quantity
      new_avg = fill_price
    }

    const new_balance = (parseFloat(user.balance) - total_cost).toFixed(2)

    await db.insert(orders).values({
      user_id: session.user.id,
      symbol,
      market_name,
      side,
      quantity: quantity.toString(),
      fill_price: fill_price.toString(),
      total_cost: total_cost.toString(),
    })

    if (existingPosition) {
      await db
        .update(positions)
        .set({
          quantity: new_qty.toString(),
          avg_fill_price: new_avg.toFixed(4),
          updated_at: new Date(),
        })
        .where(eq(positions.id, existingPosition.id))
    } else {
      await db.insert(positions).values({
        user_id: session.user.id,
        symbol,
        market_name,
        side,
        quantity: new_qty.toString(),
        avg_fill_price: new_avg.toFixed(4),
      })
    }

    await db.update(users).set({ balance: new_balance }).where(eq(users.id, session.user.id))

    return NextResponse.json({ new_balance }, { status: 201 })
  } catch (e) {
    console.error("Order error:", e)
    return NextResponse.json({ error: "Order failed. Please try again." }, { status: 500 })
  }
}

export const GET = async () => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.user_id, session.user.id))
    .orderBy(orders.created_at)

  return NextResponse.json({ orders: userOrders })
}
