import { db as postgresDb } from './index';
import { loadFromBlob, saveToBlob } from './blob-persistence';
import { users as usersSchema } from './schema';
import { eq } from 'drizzle-orm';

/**
 * A unified database interface that provides a permanent fix
 * by falling back to Vercel Blob storage if Postgres fails.
 */

export const getUnifiedUser = async (username: string) => {
  console.log(`[UnifiedDB] Searching for user by username: ${username}`);
  try {
    // 1. Try Postgres (Primary)
    const [user] = await postgresDb.select().from(usersSchema).where(eq(usersSchema.username, username.toLowerCase())).limit(1);
    if (user) {
      console.log(`[UnifiedDB] Found user in Postgres: ${username}`);
      return { user, source: 'postgres' };
    }
  } catch (err: any) {
    console.error(`[UnifiedDB] Postgres failed for ${username}:`, err.message);
  }

  // 2. Try Blob (Fallback)
  console.log(`[UnifiedDB] Attempting Blob fallback for: ${username}`);
  const users = await loadFromBlob('users') || [];
  const user = users.find((u: any) => u.username === username.toLowerCase());
  if (user) {
    console.log(`[UnifiedDB] Found user in Blob fallback: ${username}`);
    return { user, source: 'blob' };
  }

  console.log(`[UnifiedDB] User not found in any storage: ${username}`);
  return null;
};

export const getUnifiedUserById = async (id: string) => {
  console.log(`[UnifiedDB] Searching for user by ID: ${id}`);
  try {
    // 1. Try Postgres (Primary)
    const [user] = await postgresDb.select().from(usersSchema).where(eq(usersSchema.id, id)).limit(1);
    if (user) {
      console.log(`[UnifiedDB] Found user in Postgres by ID: ${id}`);
      return { user, source: 'postgres' };
    }
  } catch (err: any) {
    console.error(`[UnifiedDB] Postgres failed for ID ${id}:`, err.message);
  }

  // 2. Try Blob (Fallback)
  console.log(`[UnifiedDB] Attempting Blob fallback for ID: ${id}`);
  const users = await loadFromBlob('users') || [];
  const user = users.find((u: any) => u.id === id);
  if (user) {
    console.log(`[UnifiedDB] Found user in Blob fallback by ID: ${id}`);
    return { user, source: 'blob' };
  }

  console.log(`[UnifiedDB] User ID not found in any storage: ${id}`);
  return null;
};

export const saveUnifiedUser = async (user: any) => {
  // Always try to save to both for redundancy (Autosave)
  try {
    await postgresDb.insert(usersSchema).values(user).onConflictDoUpdate({
      target: usersSchema.id,
      set: user
    });
  } catch (err) {
    console.error('Postgres save failed:', err);
  }

  const users = await loadFromBlob('users') || [];
  const index = users.findIndex((u: any) => u.id === user.id);
  if (index >= 0) users[index] = user;
  else users.push(user);
  await saveToBlob('users', users);
};

export const updateUnifiedUser = async (id: string, data: any) => {
  // 1. Try Postgres
  try {
    await postgresDb.update(usersSchema).set(data).where(eq(usersSchema.id, id));
  } catch (err) {
    console.error('Postgres update failed:', err);
  }

  // 2. Always update Blob
  const users = await loadFromBlob('users') || [];
  const index = users.findIndex((u: any) => u.id === id);
  if (index >= 0) {
    users[index] = { ...users[index], ...data };
    await saveToBlob('users', users);
  }
};
