// src/actions/note-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createNote(formData: FormData) {
  const petId = formData.get("petId") as string
  const content = formData.get("content") as string

  if (!petId || !content) return

  try {
    await prisma.groomingNote.create({
      data: {
        petId,
        content
      }
    })

    // Revalidamos la ruta dinámica específica de esa mascota
    revalidatePath(`/pets/${petId}`)
    return { success: true }

  } catch (error) {
    console.error("Error creando nota:", error)
    return { error: "Error al guardar la nota" }
  }
}

export async function deleteNote(formData: FormData) {
    const id = formData.get("id") as string
    const petId = formData.get("petId") as string
    
    try {
        await prisma.groomingNote.delete({ where: { id } })
        revalidatePath(`/pets/${petId}`)
    } catch (e) {
        console.error(e)
    }
}