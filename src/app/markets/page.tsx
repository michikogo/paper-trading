import React from "react"
import { Container, Typography, Alert } from "@mui/material"
import { auth } from "@/auth"
import { onyxFetch, getYesPrice, OnyxMarket } from "@/lib/onyx"
import MarketList from "@/components/MarketList"

const MarketsPage = async () => {
  const session = await auth()
  if (!session) return null

  let markets: (OnyxMarket & { yes_price: number; no_price: number })[] = []
  let error = false

  try {
    const data = await onyxFetch("/markets")
    markets = (Array.isArray(data) ? data : (data.markets ?? [])).map((m: OnyxMarket) => {
      const yes_price = getYesPrice(m)
      return { ...m, yes_price, no_price: parseFloat((1 - yes_price).toFixed(4)) }
    })
  } catch {
    error = true
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Markets
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        {markets.length} markets available
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load markets from Onyx API. Please try again.
        </Alert>
      )}
      <MarketList markets={markets} />
    </Container>
  )
}

export default MarketsPage
