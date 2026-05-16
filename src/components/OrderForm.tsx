"use client"

import React, { useState } from "react"
import { Paper, Typography, TextField, Button, Stack, Alert, Divider, Box } from "@mui/material"
import { mutate } from "swr"
import { OnyxMarket } from "@/lib/onyx"

type Props = {
  market: OnyxMarket & { yes_price: number; no_price: number }
}

const OrderForm = ({ market }: Props) => {
  const [quantity, setQuantity] = useState("1")
  const [loading, setLoading] = useState<"YES" | "NO" | null>(null)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const qty = parseFloat(quantity) || 0

  const placeOrder = async (side: "YES" | "NO") => {
    setError("")
    setSuccess("")
    setLoading(side)

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: market.symbol,
        market_name: market.name,
        side,
        quantity: qty,
      }),
    })

    const data = await res.json()
    setLoading(null)

    if (!res.ok) {
      setError(data.error || "Order failed")
      return
    }

    mutate("/api/balance")
    setSuccess(
      `Order filled: ${qty} ${side} @ ${side === "YES" ? market.yes_price.toFixed(2) : market.no_price.toFixed(2)}. New balance: $${parseFloat(data.new_balance).toFixed(2)}`
    )
    setQuantity("1")
  }

  const yesCost = (qty * market.yes_price).toFixed(2)
  const noCost = (qty * market.no_price).toFixed(2)

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2 }}>
        Place Order
      </Typography>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <TextField
        label="Quantity (contracts)"
        type="number"
        size="small"
        fullWidth
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        slotProps={{ htmlInput: { min: 1, step: 1 } }}
        sx={{ mb: 3 }}
      />
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={2}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Buy YES
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Cost: ${yesCost} ({qty} × {market.yes_price.toFixed(2)})
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            disabled={loading !== null || qty <= 0}
            onClick={() => placeOrder("YES")}
            sx={{ minWidth: 100 }}
          >
            {loading === "YES" ? "Filling..." : "Buy YES"}
          </Button>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Buy NO
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Cost: ${noCost} ({qty} × {market.no_price.toFixed(2)})
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            disabled={loading !== null || qty <= 0}
            onClick={() => placeOrder("NO")}
            sx={{ minWidth: 100 }}
          >
            {loading === "NO" ? "Filling..." : "Buy NO"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  )
}

export default OrderForm
