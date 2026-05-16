import { redirect } from "next/navigation"
import { auth } from "@/auth"

const Home = async () => {
  const session = await auth()
  redirect(session ? "/markets" : "/auth/signin")
}

export default Home
