import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL!;
if (!databaseUrl && process.env.NODE_ENV === 'production') {
  // We can't throw here at build time or Next.js will fail
  console.warn('DATABASE_URL is not set');
}

const sql = neon(databaseUrl || 'postgres://placeholder:placeholder@localhost:5432/placeholder');
export const db = drizzle(sql, { schema });
