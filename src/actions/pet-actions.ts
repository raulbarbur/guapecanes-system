// src/actions/pet-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createPet(formData: FormData) {
  const name = formData.get("name") as string
  const breed = formData.get("breed") as string
  const ownerName = formData.get("ownerName") as string
  const ownerPhone = formData.get("ownerPhone") as string
  const notes = formData.get("notes") as string

  // Validación básica
  if (!name || !ownerName || !ownerPhone) {
    return { error: "Faltan datos obligatorios (Nombre, Dueño, Teléfono)" }
  }

  try {
    await prisma.pet.create({
      data: {
        name,
        breed: breed || "Mestizo",
        ownerName,
        ownerPhone,
        notes
      }
    })

    revalidatePath("/pets")
    return { success: true }

  } catch (error) {
    console.error("Error creando mascota:", error)
    return { error: "Error al guardar la ficha." }
  }
}

export async function deletePet(id: string) {
    try {
        await prisma.pet.delete({ where: { id } })
        revalidatePath("/pets")
        return { success: true }
    } catch (error) {
        return { error: "No se puede eliminar (¿Tiene turnos asignados?)" }
    }
}