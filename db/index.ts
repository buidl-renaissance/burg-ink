import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Use local SQLite if DATABASE_URL is set, otherwise use Turso
const useLocalDb = process.env.TURSO_DATABASE_URL && !process.env.TURSO_DATABASE_URL.includes('turso');

const client = useLocalDb 
  ? createClient({
      url: process.env.TURSO_DATABASE_URL!,
    })
  : createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

export const db = drizzle(client, { schema });

// Export all schema tables for convenience
export * from './schema'; 