"use client"

import React, { useState } from "react"
import { Grid, TextField, Box, Typography } from "@mui/material"
import MarketCard from "@/components/MarketCard"
import { OnyxMarket } from "@/lib/onyx"

type Props = {
  markets: (OnyxMarket & { yes_price: number; no_price: number })[]
}

const MarketList = ({ markets }: Props) => {
  const [search, setSearch] = useState("")

  const filtered = markets.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Box>
      <TextField
        placeholder="Search markets..."
        size="small"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, maxWidth: 400 }}
      />
      {filtered.length === 0 ? (
        <Typography sx={{ color: "text.secondary" }}>No markets found.</Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((market) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={market.symbol}>
              <MarketCard market={market} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default MarketList
