"use client"

import React, { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { TextField, Button, Alert, Stack } from "@mui/material"

const SignInForm = () => {
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", { email, password, redirect: false })

    setLoading(false)

    if (res?.error) {
      setError("Invalid email or password")
      return
    }

    window.location.href = "/markets"
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      {registered && <Alert severity="success">Account created — sign in to continue</Alert>}
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
      />
      <Button type="submit" variant="contained" fullWidth disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </Stack>
  )
}

export default SignInForm
