import React from "react"
import { Container } from "@mui/material"
import { auth } from "@/auth"
import { onyxFetch, getYesPrice, OnyxMarket } from "@/lib/onyx"
import MarketDetail from "@/components/MarketDetail"

const MarketPage = async ({ params }: { params: Promise<{ symbol: string }> }) => {
  const session = await auth()
  if (!session) return null

  const { symbol } = await params
  const decoded = decodeURIComponent(symbol)

  let market: (OnyxMarket & { yes_price: number; no_price: number }) | null = null

  try {
    const [m, prices] = await Promise.all([
      onyxFetch(`/markets/${decoded}`),
      onyxFetch(`/markets/${decoded}/prices`).catch(() => null),
    ])
    const yes_price = getYesPrice(m, prices)
    market = { ...m, yes_price, no_price: parseFloat((1 - yes_price).toFixed(4)) }
  } catch {
    return null
  }

  if (!market) return null

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <MarketDetail initialMarket={market} />
    </Container>
  )
}

export default MarketPage
