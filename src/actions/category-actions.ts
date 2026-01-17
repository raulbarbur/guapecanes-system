// src/actions/category-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

export async function createCategory(formData: FormData) {
  const session = await getSession()
  // Mantenemos la estructura de error consistente con este archivo
  if (!session) return { success: false, error: "No autorizado" }

  const name = formData.get("name") as string

  if (!name) return

  try {
    await prisma.category.create({
      data: { name }
    })
    
    revalidatePath("/categories")
    return { success: true }
  
  } catch (error) {
    // Si el error es porque ya existe (código P2002 de Prisma), no hacemos nada
    console.error("Error creando categoría:", error)
    return { success: false, error: "Error al crear (¿Quizás ya existe?)" }
  }
}