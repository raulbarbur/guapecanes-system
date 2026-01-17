// src/actions/user-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import { hashPassword, getSession } from "@/lib/auth" 

export async function createUser(formData: FormData) {
  // 1. SEGURIDAD (R-01) - Mantenemos validación existente y reforzada
  const session = await getSession()
  if (!session) return { error: "No autorizado." }
  if (session.role !== 'ADMIN') return { error: "Permisos insuficientes. Se requiere Administrador." }

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

    // 🔒 Encriptamos antes de guardar
    const hashedPassword = await hashPassword(password)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
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

export async function getUsers() {
    // Lectura protegida: Solo usuarios logueados pueden ver la lista
    const session = await getSession()
    if (!session) return { error: "No autorizado." }

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
    // Seguridad Crítica: Solo admin borra usuarios
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: "No autorizado." }

    const id = formData.get("id") as string
    
    // R-01 Adicional: Evitar auto-eliminación
    // Asumimos que session tiene 'id' dado que es un objeto User o derivado.
    if (session.userId && session.userId === id) {
        return { error: "No puedes eliminar tu propio usuario." }
    }

    try {
        await prisma.user.delete({ where: { id } })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (e) { return { error: "Error al eliminar" } }
}