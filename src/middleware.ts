// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// R-01: Validación estricta de entorno.
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET no está definida en variables de entorno.");
}

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

// Rutas públicas (No requieren login)
const publicRoutes = ["/login"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Permitir acceso a archivos estáticos y rutas públicas
  if (
    publicRoutes.includes(path) ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.includes(".") // Archivos con extensión (jpg, ico, png, etc)
  ) {
    return NextResponse.next();
  }

  // 2. Leer la cookie de sesión
  const session = req.cookies.get("session")?.value;

  // 3. Si no hay sesión, mandar al Login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // 4. Verificar criptográficamente el token
    await jwtVerify(session, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    // ¡Token válido! Pasa.
    return NextResponse.next();

  } catch (error) {
    // 5. Token inválido o expirado -> Mandar al login y limpiar cookie basura
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  }
}

// Configuración: Ejecutar en todas las rutas excepto API internas y estáticos de Next
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};