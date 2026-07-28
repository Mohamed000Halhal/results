import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-admin-key-change-this-in-production-2026';
const COOKIE_NAME = 'admin_session';

export interface AdminPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Sign an admin session token (valid for 24 hours).
 */
export function createAdminToken(): string {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify a token and return payload if valid.
 */
export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

/**
 * Check if current request has a valid admin cookie session.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = verifyAdminToken(token);
  return payload?.role === 'admin';
}

/**
 * Validate password against environment configuration.
 */
export function checkAdminPassword(password: string): boolean {
  const envPassword = process.env.ADMIN_PASSWORD || 'Mido500@#$';

  return password === envPassword;
}

export { COOKIE_NAME };
