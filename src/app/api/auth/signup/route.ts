import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export const POST = async (req: NextRequest) => {
  const { email, password } = await req.json()

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 })
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)
  await db.insert(users).values({ email, password_hash })

  return NextResponse.json({ success: true }, { status: 201 })
}
