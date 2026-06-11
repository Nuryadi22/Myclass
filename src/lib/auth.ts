import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-myclass-monitoring-app-2026'
);

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(password, hashed);
}

export async function signJWT(payload: {
  userId: number;
  name: string;
  username: string;
  role: string;
  className?: string | null;
  appTitle?: string | null;
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as {
      userId: number;
      name: string;
      username: string;
      role: string;
      className?: string | null;
      appTitle?: string | null;
    };
  } catch (e) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return await verifyJWT(token);
}
