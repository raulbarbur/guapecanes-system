// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// R-01: Validación estricta de entorno. Sin clave, no hay sistema.
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET no está definida en variables de entorno.");
}

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

// --- 1. HASHING (Protección de Contraseñas) ---

export async function hashPassword(plainText: string): Promise<string> {
  // Salt rounds: 10 es el estándar actual de balance seguridad/velocidad
  return await bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}

// --- 2. SESIÓN (Manejo de Cookies JWT) ---

export async function createSession(userId: string, role: string, name: string) {
  // Creamos el token
  const token = await new SignJWT({ userId, role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h") // La sesión dura 8 horas laborables
    .sign(SECRET_KEY);

  // Guardamos en Cookie HTTP-Only (Inaccesible para JavaScript del navegador -> Anti XSS)
  const cookieStore = await cookies();
  
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 horas en segundos
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as { userId: string; role: string; name: string };
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}