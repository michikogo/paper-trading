const BASE = process.env.ONYX_API_BASE!

export const onyxFetch = async (path: string) => {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Onyx API error: ${res.status} ${path}`)
  return res.json()
}

export type OnyxMarket = {
  id: string
  symbol: string
  sport: string
  name: string
  event_name: string | null
  status: string
  expiry_date: string
  min_price: number
  max_price: number
  yes_price: number | null
}

export type OnyxPrice = {
  symbol: string
  bid_price: number | null
  ask_price: number | null
  last_price: number | null
  volume: number
}

export const getYesPrice = (market: OnyxMarket, prices?: OnyxPrice): number => {
  return prices?.ask_price ?? market.yes_price ?? 0.5
}
