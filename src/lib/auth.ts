import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const COOKIE_NAME = "sale_token";
const MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export async function hashPassword(pwd: string): Promise<string> {
  return bcrypt.hash(pwd, 10);
}

export async function verifyPassword(pwd: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pwd, hash);
}

export function signToken(payload: { uid: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

export async function setSessionCookie(uid: string) {
  const token = signToken({ uid });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { uid } = jwt.verify(token, JWT_SECRET) as { uid: string };
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
