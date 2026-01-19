import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// 1. Obtener la clave secreta
const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

// Definimos la estructura exacta de nuestra sesión
interface SessionPayload extends JWTPayload {
  userId: string;
  role: string;
  name: string;
}

// 2. Hashing de Contraseña (NUEVA FUNCIÓN AGREGADA)
export async function hashPassword(password: string) {
  // El "10" es el salt rounds, estándar de seguridad
  return await bcrypt.hash(password, 10);
}

// 3. Verificar Contraseña
export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// 4. Crear Sesión (Cookie)
export async function createSession(userId: string, role: string, name: string) {
  if (!secretKey) throw new Error("JWT_SECRET no definida");

  const payload: SessionPayload = { userId, role, name };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);

  const isProduction = process.env.NODE_ENV === "production";
  
  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

// 5. Obtener Sesión (Tipada correctamente)
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, key, {
      algorithms: ["HS256"],
    });
    
    return payload as unknown as SessionPayload;
    
  } catch (error) {
    return null;
  }
}

// 6. Cerrar Sesión
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}