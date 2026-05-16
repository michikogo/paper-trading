import React, { Suspense } from "react"
import { Container, Paper, Typography, Box } from "@mui/material"
import SignInForm from "@/components/SignInForm"

const SignInPage = () => {
  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Sign in
        </Typography>
        <Suspense>
          <SignInForm />
        </Suspense>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            No account? <a href="/auth/signup">Sign up</a>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default SignInPage
