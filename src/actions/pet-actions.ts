// src/actions/pet-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

export async function createPet(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: "No autorizado" }

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
    const session = await getSession()
    if (!session) return { error: "No autorizado" }

    try {
        // R-05: Verificación de Integridad de Agenda
        // No permitir borrado si hay turnos pendientes o confirmados a futuro.
        const activeAppointments = await prisma.appointment.findFirst({
            where: {
                petId: id,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        })

        if (activeAppointments) {
            return { error: "⛔ No se puede eliminar: La mascota tiene turnos activos en la agenda. Cancele los turnos primero." }
        }

        await prisma.pet.delete({ where: { id } })
        revalidatePath("/pets")
        return { success: true }

    } catch (error) {
        // Captura error genérico o constraints de FK residuales
        console.error("Error eliminando mascota:", error)
        return { error: "No se puede eliminar la mascota (Posible historial asociado)." }
    }
}