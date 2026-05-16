"use client"

import React, { useState } from "react"
import { TextField, Button, Alert, Stack } from "@mui/material"
import { useRouter } from "next/navigation"

const SignUpForm = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Sign up failed")
      return
    }

    router.push("/auth/signin?registered=true")
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        required
        fullWidth
        size="small"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        required
        fullWidth
        size="small"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        slotProps={{ htmlInput: { minLength: 8 } }}
        helperText="Minimum 8 characters"
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading}>
        {loading ? "Creating account..." : "Sign up"}
      </Button>
    </Stack>
  )
}

export default SignUpForm
