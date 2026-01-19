// src/actions/auth-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession, deleteSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) return { error: "Completá todos los campos." }

  try {
    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Por seguridad, mensaje genérico para no revelar si existe el mail
      return { error: "Credenciales inválidas." }
    }

    // 2. Verificar contraseña
    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return { error: "Credenciales inválidas." }
    }

    // 3. Crear Sesión (Cookie)
    await createSession(user.id, user.role, user.name)

  } catch (error) {
    console.error("Login error:", error)
    return { error: "Error intentando iniciar sesión." }
  }

  // Redirección fuera del try/catch (requisito de Next.js)
  redirect("/dashboard")
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}