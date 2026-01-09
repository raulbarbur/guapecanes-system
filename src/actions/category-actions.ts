// src/actions/category-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCategory(formData: FormData) {
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