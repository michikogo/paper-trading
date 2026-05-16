import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { auth } from "@/auth"
import Nav from "@/components/Nav"
import ThemeRegistry from "@/components/ThemeRegistry"

export const dynamic = "force-dynamic"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Onyx Paper Trading",
  description: "Simulated prediction market trading",
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()

  return (
    <html lang="en" className={geist.variable}>
      <body>
        <ThemeRegistry>
          {session && <Nav />}
          <main>{children}</main>
        </ThemeRegistry>
      </body>
    </html>
  )
}

export default RootLayout
