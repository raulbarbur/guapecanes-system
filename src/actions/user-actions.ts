// src/actions/user-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import { hashPassword } from "@/lib/auth" // 👈 Importamos la seguridad

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as Role || "STAFF"

  if (!name || !email || !password) {
    return { error: "Todos los campos son obligatorios" }
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return { error: "El email ya está registrado." }
    }

    // 🔒 AHORA ENCRIPTAMOS ANTES DE GUARDAR
    const hashedPassword = await hashPassword(password)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Guardamos el hash, no el texto
        role
      }
    })

    revalidatePath("/admin/users")
    return { success: true }

  } catch (error) {
    console.error("Error creando usuario:", error)
    return { error: "Error interno al crear usuario" }
  }
}

// ... (El resto de funciones getUsers y deleteUser se mantienen igual)
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        })
        return { success: true, data: users }
    } catch (error) {
        return { error: "Error al cargar usuarios" }
    }
}

export async function deleteUser(formData: FormData) {
    const id = formData.get("id") as string
    try {
        await prisma.user.delete({ where: { id } })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (e) { return { error: "Error" } }
}