import type { Config } from "drizzle-kit";

const databaseUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
const isTurso = databaseUrl.startsWith("libsql://") || databaseUrl.startsWith("https://");

export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
    ...(isTurso && process.env.TURSO_AUTH_TOKEN && {
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
  },
} satisfies Config;