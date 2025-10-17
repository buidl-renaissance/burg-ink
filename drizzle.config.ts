import dotenv from "dotenv";

dotenv.config();

import type { Config } from "drizzle-kit";

// Use local SQLite if DATABASE_URL is set, otherwise use Turso
const useLocalDb = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('turso');

export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: useLocalDb ? "sqlite" : "turso",
  dbCredentials: useLocalDb ? {
    url: process.env.DATABASE_URL!,
  } : {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;