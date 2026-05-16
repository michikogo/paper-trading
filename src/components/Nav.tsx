"use client"

import React from "react"
import { AppBar, Toolbar, Typography, Button, Chip, Box } from "@mui/material"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const Nav = () => {
  const pathname = usePathname()
  const { data } = useSWR<{ balance: string }>("/api/balance", fetcher, {
    refreshInterval: 30000,
  })

  const balance = data?.balance ? `$${parseFloat(data.balance).toFixed(2)}` : "—"

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ gap: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main", mr: 2 }}>
          Onyx Paper Trading
        </Typography>
        <Button
          component={Link}
          href="/markets"
          color={pathname.startsWith("/markets") ? "primary" : "inherit"}
          sx={{ fontWeight: pathname.startsWith("/markets") ? 700 : 400 }}
        >
          Markets
        </Button>
        <Button
          component={Link}
          href="/portfolio"
          color={pathname.startsWith("/portfolio") ? "primary" : "inherit"}
          sx={{ fontWeight: pathname.startsWith("/portfolio") ? 700 : 400 }}
        >
          Portfolio
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          label={`Balance: ${balance}`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Button
          color="inherit"
          size="small"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          Sign out
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default Nav
