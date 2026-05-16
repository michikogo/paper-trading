import { pgTable, text, numeric, timestamp, pgEnum, unique } from "drizzle-orm/pg-core"

export const sideEnum = pgEnum("side", ["YES", "NO"])

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  created_at: timestamp("created_at").notNull().defaultNow(),
})

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id),
  symbol: text("symbol").notNull(),
  market_name: text("market_name").notNull(),
  side: sideEnum("side").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 4 }).notNull(),
  fill_price: numeric("fill_price", { precision: 6, scale: 4 }).notNull(),
  total_cost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
})

export const positions = pgTable(
  "positions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    symbol: text("symbol").notNull(),
    market_name: text("market_name").notNull(),
    side: sideEnum("side").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 4 }).notNull(),
    avg_fill_price: numeric("avg_fill_price", { precision: 6, scale: 4 }).notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.user_id, t.symbol, t.side)]
)
