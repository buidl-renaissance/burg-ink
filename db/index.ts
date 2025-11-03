import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const databaseUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const isTurso = databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://');

const client = createClient({
  url: databaseUrl,
  ...(isTurso && process.env.TURSO_AUTH_TOKEN && {
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
});

export const db = drizzle(client, { schema });

// Export all schema tables for convenience
export * from './schema'; 