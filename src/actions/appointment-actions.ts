// src/actions/appointment-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAppointment(formData: FormData) {
  const petId = formData.get("petId") as string
  const dateStr = formData.get("date") as string // "2024-01-20"
  const timeStr = formData.get("time") as string // "14:30"
  const duration = parseInt(formData.get("duration") as string) || 60 // Minutos

  if (!petId || !dateStr || !timeStr) {
    return { error: "Faltan datos (Mascota, Fecha u Hora)" }
  }

  try {
    // 1. CONSTRUIR FECHAS (Start y End)
    // Combinamos fecha y hora en un objeto Date
    const startTime = new Date(`${dateStr}T${timeStr}:00`)
    // Calculamos el final sumando minutos
    const endTime = new Date(startTime.getTime() + duration * 60000)

    // Validar que sea una fecha válida
    if (isNaN(startTime.getTime())) {
      return { error: "Fecha u hora inválida" }
    }

    // 2. VALIDAR COLISIONES (La Regla de Oro)
    // Buscamos si existe algún turno que NO esté cancelado Y que se superponga
    const collision = await prisma.appointment.findFirst({
      where: {
        status: { not: 'CANCELLED' }, // Ignoramos los cancelados
        AND: [
          { startTime: { lt: endTime } }, // Que empiece antes de que yo termine
          { endTime: { gt: startTime } }  // Y que termine después de que yo empiece
        ]
      },
      include: { pet: true }
    })

    if (collision) {
      return { 
        error: `Horario ocupado por ${collision.pet.name} (${collision.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${collision.endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})` 
      }
    }

    // 3. GUARDAR TURNO
    await prisma.appointment.create({
      data: {
        petId,
        startTime,
        endTime,
        status: 'PENDING'
      }
    })

    revalidatePath("/agenda")
    return { success: true }

  } catch (error) {
    console.error("Error agendando:", error)
    return { error: "Error interno al crear turno" }
  }
}

export async function cancelAppointment(formData: FormData) {
    const id = formData.get("id") as string
    try {
        await prisma.appointment.update({
            where: { id },
            data: { status: 'CANCELLED' }
        })
        revalidatePath("/agenda")
    } catch (error) {
        console.error(error)
    }
}