// src/app/page.tsx
import { redirect } from "next/navigation";

/**
 * FE-07: Root Dispatcher
 * Esta página actúa como punto de entrada.
 * Delega la lógica de protección de rutas al Middleware.
 * 
 * Flujo:
 * 1. Intenta ir a /dashboard
 * 2. Si Middleware detecta sesión -> Pasa.
 * 3. Si Middleware NO detecta sesión -> Redirige a /login.
 */
export default function RootPage() {
  redirect("/dashboard");
}