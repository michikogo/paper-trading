"use client"

import React from "react"
import { Typography, Box, Paper, Chip } from "@mui/material"
import useSWR from "swr"
import { OnyxMarket, getYesPrice } from "@/lib/onyx"
import OrderForm from "@/components/OrderForm"

type Props = {
  initialMarket: OnyxMarket & { yes_price: number; no_price: number }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const MarketDetail = ({ initialMarket }: Props) => {
  const { data } = useSWR(`/api/markets/${encodeURIComponent(initialMarket.symbol)}`, fetcher, {
    refreshInterval: 15000,
    fallbackData: initialMarket,
  })

  const yes_price = data ? getYesPrice(data, data.prices) : initialMarket.yes_price
  const no_price = parseFloat((1 - yes_price).toFixed(4))
  const market = { ...(data ?? initialMarket), yes_price, no_price }

  return (
    <Box>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: 11, mb: 1 }}
      >
        {market.sport}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.4 }}>
        {market.name}
      </Typography>
      <Chip
        label={market.status}
        size="small"
        color={market.status === "open" ? "success" : "default"}
        variant="outlined"
        sx={{ mb: 3 }}
      />
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Paper variant="outlined" sx={{ flex: 1, p: 3, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
            YES
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "success.main" }}>
            {(yes_price * 100).toFixed(0)}¢
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, p: 3, textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
            NO
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "error.main" }}>
            {(no_price * 100).toFixed(0)}¢
          </Typography>
        </Paper>
      </Box>
      <OrderForm market={market} />
    </Box>
  )
}

export default MarketDetail
