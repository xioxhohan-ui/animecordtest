import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from './schema';

// This handles both build-time (where env might be missing) and runtime
export const db = drizzle(sql, { schema });
