import * as dotenv from 'dotenv';

// Load environment variables from .env.local and .env files
dotenv.config({ path: '.env' });
dotenv.config();

const databaseUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
const isTurso = databaseUrl.startsWith("libsql://") || databaseUrl.startsWith("https://");

// Debug: Log what we're seeing
console.log('=== Drizzle Config Debug ===');
console.log('Database URL:', databaseUrl);
console.log('Is Turso:', isTurso);
console.log('Has Auth Token:', !!process.env.TURSO_AUTH_TOKEN);
console.log('Auth Token length:', process.env.TURSO_AUTH_TOKEN?.length || 0);
console.log('Auth Token (first 10 chars):', process.env.TURSO_AUTH_TOKEN?.substring(0, 10) || 'N/A');
console.log('===========================');

const config = {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "sqlite" as const,
  dbCredentials: {
    url: databaseUrl,
  },
};

// Add authToken for Turso connections
if (isTurso && process.env.TURSO_AUTH_TOKEN) {
  // @ts-expect-error - authToken is valid for libsql but not in drizzle-kit types
  config.dbCredentials.authToken = process.env.TURSO_AUTH_TOKEN;
  console.log('✅ authToken added to config');
}

console.log('Final config.dbCredentials:', JSON.stringify({
  url: config.dbCredentials.url,
  // @ts-expect-error - checking if authToken is present
  hasAuthToken: !!config.dbCredentials.authToken,
}));

export default config;