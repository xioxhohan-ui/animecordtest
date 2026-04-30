import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { comparePassword, signToken, hashPassword } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const { username, password, deviceId } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    // Try to find user
    let user;
    try {
      [user] = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
    } catch (dbError: any) {
      console.error('Database access error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: 'Vercel Postgres is not responding. 1. Go to Vercel Dashboard -> Storage -> Connect Postgres. 2. Ensure POSTGRES_URL is set.',
        technical: dbError.message 
      }, { status: 500 });
    }

    // Auto-seed CEO if no users exist and trying to login as ceo
    if (!user && username.toLowerCase() === 'ceo') {
      const allUsers = await db.select().from(users).limit(1);
      if (allUsers.length === 0) {
        const hashedPassword = await hashPassword('ceo123');
        const [newCeo] = await db.insert(users).values({
          id: nanoid(),
          username: 'ceo',
          passwordHash: hashedPassword,
          displayName: 'CEO',
          role: 'CEO',
          avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=ceo',
        }).returning();
        user = newCeo;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.banned) {
      return NextResponse.json({ error: 'Your account has been permanently banned' }, { status: 403 });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last active
    await db.update(users).set({ 
      lastActive: new Date(),
      deviceId: deviceId || user.deviceId
    }).where(eq(users.id, user.id));

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ token, user: safeUser });
  } catch (error: any) {
    console.error('Login error details:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
