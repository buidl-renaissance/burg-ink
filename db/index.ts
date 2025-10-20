import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Use local SQLite database
const client = createClient({
  url: 'file:local.db',
});

export const db = drizzle(client, { schema });

// Export all schema tables for convenience
export * from './schema'; 