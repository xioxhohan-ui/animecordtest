import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// We use a getter to lazily initialize the connection only when needed.
// This prevents the "No database connection string" error during Vercel builds.
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';

// Create a proxy or a lazy-loaded DB instance
export const db = drizzle(neon(connectionString || 'postgres://localhost/placeholder'), { schema });
