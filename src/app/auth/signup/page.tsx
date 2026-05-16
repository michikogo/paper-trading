import React from "react"
import { Container, Paper, Typography, Box } from "@mui/material"
import SignUpForm from "@/components/SignUpForm"

const SignUpPage = () => {
  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Create account
        </Typography>
        <SignUpForm />
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            Already have an account? <a href="/auth/signin">Sign in</a>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default SignUpPage
