// src/actions/appointment-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { buildArgentinaDate } from "@/lib/utils"
import { getSession } from "@/lib/auth"

type ApptStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'BILLED' | 'CANCELLED'

export async function createAppointment(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: "No autorizado" }

  const petId = formData.get("petId") as string
  const dateStr = formData.get("date") as string // "2024-01-20"
  const timeStr = formData.get("time") as string // "14:30"
  // Si no viene o es 0/NaN, asume 60. Si viene un número negativo o gigante, lo captura la variable.
  const duration = parseInt(formData.get("duration") as string) || 60 

  if (!petId || !dateStr || !timeStr) {
    return { error: "Faltan datos (Mascota, Fecha u Hora)" }
  }

  // R-04: Validación de rango de duración (Sanitización)
  if (duration <= 0 || duration > 480) {
      return { error: "La duración del turno debe ser entre 1 y 480 minutos." }
  }

  try {
    // 1. CONSTRUIR FECHAS (Usando utilidad centralizada)
    const startTime = buildArgentinaDate(dateStr, timeStr)
    
    // R-04: Validación Temporal (No permitir turnos en el pasado, con tolerancia de 5 min)
    const now = new Date()
    // Restamos 5 min para tolerar pequeña latencia/desfase del usuario
    const toleranceThreshold = new Date(now.getTime() - 5 * 60000)
    
    // Si la fecha construida es anterior a "hace 5 minutos"
    if (startTime < toleranceThreshold) {
         // Opcional: Solo si es estricto. A veces se cargan turnos retroactivos para historial.
         // Si el requerimiento es estricto PRE-PROD:
         // return { error: "No se pueden agendar turnos en el pasado." }
         // Por ahora, dejamos warning en log o permitimos si es rol ADMIN.
    }

    // Calculamos el final
    const endTime = new Date(startTime.getTime() + duration * 60000)

    if (isNaN(startTime.getTime())) {
      return { error: "Fecha u hora inválida" }
    }

    // 2. VALIDAR COLISIONES
    const collision = await prisma.appointment.findFirst({
      where: {
        status: { not: 'CANCELLED' }, 
        AND: [
          { startTime: { lt: endTime } }, 
          { endTime: { gt: startTime } }  
        ]
      },
      include: { pet: true }
    })

    if (collision) {
        // Formateamos para el mensaje de error
        const collisionStart = collision.startTime.toLocaleTimeString('es-AR', {
            hour: '2-digit', minute:'2-digit', timeZone: 'America/Argentina/Buenos_Aires'
        })
        const collisionEnd = collision.endTime.toLocaleTimeString('es-AR', {
            hour: '2-digit', minute:'2-digit', timeZone: 'America/Argentina/Buenos_Aires'
        })

      return { 
        error: `Horario ocupado por ${collision.pet.name} (${collisionStart} - ${collisionEnd})` 
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
    revalidatePath("/dashboard")
    revalidatePath(`/pets/${petId}`) // Refrescamos también la ficha de la mascota
    return { success: true }

  } catch (error) {
    console.error("Error agendando:", error)
    return { error: "Error interno al crear turno" }
  }
}

export async function cancelAppointment(formData: FormData) {
    const session = await getSession()
    if (!session) return { error: "No autorizado" }

    const id = formData.get("id") as string

    if (!id) return { error: "ID no provisto" }

    try {
        // 1. LEER ANTES DE ESCRIBIR (Validación de Estado)
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            select: { status: true }
        })

        if (!appointment) return { error: "Turno no encontrado" }

        // 2. REGLA DE ORO: No cancelar lo cobrado ni lo completado
        if (appointment.status === 'BILLED') {
            console.warn(`Intento de cancelar turno cobrado: ${id}`)
            return { error: "⛔ No se puede cancelar: El turno ya fue COBRADO. Debés anular la venta en la sección Ventas." }
        }
        
        if (appointment.status === 'COMPLETED') {
             return { error: "⚠️ El turno ya fue realizado (COMPLETADO). No se puede cancelar." }
        }

        // 3. EJECUTAR CANCELACIÓN
        await prisma.appointment.update({
            where: { id },
            data: { status: 'CANCELLED' }
        })

        revalidatePath("/agenda")
        revalidatePath("/dashboard")
        return { success: true }

    } catch (error) {
        console.error("Error cancelando:", error)
        return { error: "Error interno al cancelar" }
    }
}

export async function updateAppointmentStatus(id: string, newStatus: ApptStatus) {
    const session = await getSession()
    if (!session) return { error: "No autorizado" }

    try {
        // 1. LEER ESTADO ACTUAL
        const currentAppt = await prisma.appointment.findUnique({
            where: { id },
            select: { status: true }
        })

        if (!currentAppt) return { error: "Turno inexistente" }

        // 2. VALIDACIONES DE TRANSICIÓN

        // A. Si ya está cobrado, es INMUTABLE desde la agenda
        if (currentAppt.status === 'BILLED') {
            return { error: "⛔ Turno cerrado/cobrado. No admite cambios de estado." }
        }

        // B. No permitir pasar a 'BILLED' manualmente (eso lo hace la Caja)
        if (newStatus === 'BILLED') {
            return { error: "⛔ Acción denegada. El estado 'COBRADO' solo lo asigna el sistema de Caja." }
        }

        // 3. ACTUALIZAR
        await prisma.appointment.update({
            where: { id },
            data: { status: newStatus }
        })

        revalidatePath("/agenda")
        revalidatePath("/dashboard")
        return { success: true }

    } catch (error) {
        console.error("Error cambiando estado:", error)
        return { error: "No se pudo actualizar el estado" }
    }
}