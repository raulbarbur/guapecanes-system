// src/actions/customer-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const email = formData.get("email") as string
  const address = formData.get("address") as string

  if (!name) return { error: "El nombre es obligatorio" }

  try {
    // 1. Guardamos el resultado en una variable
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null
      }
    })

    revalidatePath("/customers")
    revalidatePath("/pos") 
    
    // 2. Retornamos el cliente creado junto con el éxito
    return { success: true, customer: newCustomer }

  } catch (error) {
    console.error("Error creando cliente:", error)
    return { error: "Error interno al crear cliente." }
  }
}


export async function updateCustomer(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const email = formData.get("email") as string
  const address = formData.get("address") as string

  if (!id || !name) return { error: "Faltan datos obligatorios." }

  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null
      }
    })

    revalidatePath("/customers")
    revalidatePath(`/customers/${id}`)
    revalidatePath("/pos")
    return { success: true }

  } catch (error) {
    console.error("Error actualizando cliente:", error)
    return { error: "Error al actualizar." }
  }
}

export async function deleteCustomer(formData: FormData) {
  const id = formData.get("id") as string

  if (!id) return { error: "ID requerido" }

  try {
    const pendingDebts = await prisma.sale.count({
        where: {
            customerId: id,
            paymentStatus: 'PENDING'
        }
    })

    if (pendingDebts > 0) {
        return { error: "⛔ No se puede eliminar: El cliente tiene deuda activa (Fiado). Debe saldarla o anular las ventas antes de borrar." }
    }

    const customerWithHistory = await prisma.customer.findUnique({
        where: { id },
        include: { _count: { select: { sales: true } } }
    })

    if (customerWithHistory && customerWithHistory._count.sales > 0) {
        return { error: "⛔ No se puede eliminar: El cliente tiene historial de compras asociado." }
    }

    await prisma.customer.delete({ where: { id } })
    
    revalidatePath("/customers")
    revalidatePath("/pos")
    return { success: true }

  } catch (error) {
    console.error("Error eliminando cliente:", error)
    return { error: "No se pudo eliminar el cliente." }
  }
}

// FUNCION COBRAR DEUDA
export async function markSaleAsPaid(saleId: string) {
    const session = await getSession()
    if (!session) return { error: "No autorizado" }

    try {
        const currentSale = await prisma.sale.findUnique({
            where: { id: saleId },
            select: { paymentStatus: true }
        })

        if (!currentSale) return { error: "Venta no encontrada" }

        if (currentSale.paymentStatus === 'PAID') {
            return { success: true, message: "Venta ya estaba cobrada previamente" }
        }

        await prisma.sale.update({
            where: { id: saleId },
            data: { 
                paymentStatus: 'PAID',
                paidAt: new Date()
            }
        })

        revalidatePath("/customers")
        revalidatePath("/sales") 
        return { success: true }
    } catch (error) {
        return { error: "Error al registrar el pago." }
    }
}