import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// 1. Obtener la clave secreta
const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

// 2. Verificar Contraseña
export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// 3. Crear Sesión (Cookie)
export async function createSession(userId: string, role: string, name: string) {
  if (!secretKey) throw new Error("JWT_SECRET no definida");

  const payload = { userId, role, name };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);

  const isProduction = process.env.NODE_ENV === "production";
  
  // Usamos await cookies() para compatibilidad
  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

// 4. Obtener Sesión (Antes llamada verifySession, ahora getSession para compatibilidad)
export async function getSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

// 5. Cerrar Sesión
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}