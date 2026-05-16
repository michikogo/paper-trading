"use client"

import React from "react"
import { Card, CardContent, CardActionArea, Chip, Typography, Box, Stack } from "@mui/material"
import { useRouter } from "next/navigation"
import { OnyxMarket } from "@/lib/onyx"

type MarketCardProps = {
  market: OnyxMarket & { yes_price: number; no_price: number }
}

const MarketCard = ({ market }: MarketCardProps) => {
  const router = useRouter()

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea
        onClick={() => router.push(`/markets/${encodeURIComponent(market.symbol)}`)}
        sx={{ height: "100%", alignItems: "flex-start" }}
      >
        <CardContent sx={{ height: "100%" }}>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 1, textTransform: "uppercase", fontSize: 11 }}
          >
            {market.sport}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, lineHeight: 1.4 }}>
            {market.name}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Box
              sx={{ flex: 1, textAlign: "center", bgcolor: "success.50", borderRadius: 1, p: 1 }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                YES
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                {(market.yes_price * 100).toFixed(0)}¢
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: "center", bgcolor: "error.50", borderRadius: 1, p: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                NO
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                {(market.no_price * 100).toFixed(0)}¢
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={market.status}
            size="small"
            color={market.status === "open" ? "success" : "default"}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default MarketCard
