import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    // 1. Create Users Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'USER' NOT NULL,
        display_name TEXT,
        avatar TEXT,
        banner TEXT,
        bio TEXT,
        status TEXT DEFAULT 'online',
        last_active TIMESTAMP DEFAULT NOW(),
        banned BOOLEAN DEFAULT FALSE,
        risk_score INTEGER DEFAULT 0,
        device_id TEXT,
        coins INTEGER DEFAULT 100,
        ip_info JSONB,
        active_frame TEXT,
        owned_frames JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Create Servers Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT,
        banner TEXT,
        description TEXT,
        owner_id TEXT REFERENCES users(id),
        is_public BOOLEAN DEFAULT TRUE,
        invite_code TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Create Members Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        server_id TEXT REFERENCES servers(id),
        user_id TEXT REFERENCES users(id),
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Create Channels Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        server_id TEXT REFERENCES servers(id),
        name TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Create Messages Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT REFERENCES channels(id),
        sender_id TEXT REFERENCES users(id),
        content TEXT NOT NULL,
        attachments JSONB,
        reactions JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Create DMs Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS dms (
        id TEXT PRIMARY KEY,
        dm_key TEXT NOT NULL,
        sender_id TEXT REFERENCES users(id),
        receiver_id TEXT REFERENCES users(id),
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // 7. Create Moderation Logs
    await db.execute(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL,
        target_id TEXT,
        performed_by TEXT,
        reason TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Create CEO User if not exists
    const hashedPassword = await hashPassword('ceo123');
    await db.execute(`
      INSERT INTO users (id, username, password_hash, display_name, role, avatar)
      VALUES ('${nanoid()}', 'ceo', '${hashedPassword}', 'CEO', 'CEO', 'https://api.dicebear.com/7.x/notionists/svg?seed=ceo')
      ON CONFLICT (username) DO NOTHING;
    `);

    return NextResponse.json({ 
      status: 'success', 
      message: 'Database tables verified/created and CEO account seeded.' 
    });
  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      hint: 'Check your POSTGRES_URL environment variable.'
    }, { status: 500 });
  }
}
