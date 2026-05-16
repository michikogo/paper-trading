import React from "react"
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
} from "@mui/material"
import { auth } from "@/auth"
import { db } from "@/db"
import { users, positions as positionsTable, orders as ordersTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { onyxFetch, getYesPrice } from "@/lib/onyx"
import LocalTime from "@/components/LocalTime"

const PortfolioPage = async () => {
  const session = await auth()
  if (!session) return null

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)

  const userPositions = await db
    .select()
    .from(positionsTable)
    .where(eq(positionsTable.user_id, session.user.id))

  const userOrders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.user_id, session.user.id))
    .orderBy(ordersTable.created_at)

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
        // fall back to avg fill price
      }

      const avg = parseFloat(pos.avg_fill_price)
      const qty = parseFloat(pos.quantity)
      const unrealized_pnl =
        pos.side === "YES" ? (current_price - avg) * qty : (1 - current_price - avg) * qty

      return { ...pos, current_price, unrealized_pnl: parseFloat(unrealized_pnl.toFixed(2)) }
    })
  )

  const totalPnl = positionsWithPnl.reduce((sum, p) => sum + p.unrealized_pnl, 0)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, cursor: "default" }}>
        Portfolio
      </Typography>

      <Box sx={{ display: "flex", gap: 3, mb: 4 }}>
        <Paper variant="outlined" sx={{ p: 3, flex: 1, cursor: "default" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
            Cash Balance
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            ${parseFloat(user.balance).toFixed(2)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3, flex: 1, cursor: "default" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
            Unrealized P&amp;L
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: totalPnl >= 0 ? "success.main" : "error.main" }}
          >
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </Typography>
        </Paper>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, cursor: "default" }}>
        Positions
      </Typography>
      {positionsWithPnl.length === 0 ? (
        <Typography sx={{ color: "text.secondary", mb: 4 }}>
          No positions yet. Place an order to get started.
        </Typography>
      ) : (
        <Paper variant="outlined" sx={{ mb: 4, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50", cursor: "default" }}>
                <TableCell sx={{ fontWeight: 600 }}>Market</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Side</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Avg Price
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Current
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Unrealized P&amp;L
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {positionsWithPnl.map((pos) => (
                <TableRow key={pos.id} hover sx={{ cursor: "default" }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {pos.market_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {pos.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={pos.side}
                      size="small"
                      color={pos.side === "YES" ? "success" : "error"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{parseFloat(pos.quantity).toFixed(0)}</TableCell>
                  <TableCell align="right">
                    {(parseFloat(pos.avg_fill_price) * 100).toFixed(0)}¢
                  </TableCell>
                  <TableCell align="right">{(pos.current_price * 100).toFixed(0)}¢</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: pos.unrealized_pnl >= 0 ? "success.main" : "error.main" }}
                  >
                    {pos.unrealized_pnl >= 0 ? "+" : ""}${pos.unrealized_pnl.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, cursor: "default" }}>
        Order History
      </Typography>
      {userOrders.length === 0 ? (
        <Typography sx={{ color: "text.secondary" }}>No orders yet.</Typography>
      ) : (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50", cursor: "default" }}>
                <TableCell sx={{ fontWeight: 600 }}>Market</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Side</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Fill Price
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Total Cost
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Date
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...userOrders].reverse().map((order) => (
                <TableRow key={order.id} hover sx={{ cursor: "default" }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {order.market_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {order.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.side}
                      size="small"
                      color={order.side === "YES" ? "success" : "error"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{parseFloat(order.quantity).toFixed(0)}</TableCell>
                  <TableCell align="right">
                    {(parseFloat(order.fill_price) * 100).toFixed(0)}¢
                  </TableCell>
                  <TableCell align="right">${parseFloat(order.total_cost).toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                    <LocalTime iso={order.created_at} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  )
}

export default PortfolioPage
