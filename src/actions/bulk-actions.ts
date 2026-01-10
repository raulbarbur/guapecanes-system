// src/actions/bulk-actions.ts
'use server'

import { prisma } from "@/lib/prisma"

// Definimos qué esperamos recibir de cada fila del Excel
type ImportRow = {
  name: string
  categoryName: string
  ownerName: string
  cost: number
  price: number
}

export async function importSingleProduct(data: ImportRow) {
  try {
    // 1. BUSCAR O CREAR CATEGORÍA (Case Insensitive)
    // Truco: Buscamos primero para no fallar por unique constraint
    let category = await prisma.category.findFirst({
      where: { name: { equals: data.categoryName, mode: 'insensitive' } }
    })

    if (!category) {
      category = await prisma.category.create({
        data: { name: data.categoryName } // Creamos si no existe
      })
    }

    // 2. BUSCAR DUEÑO (Por nombre exacto o aproximado)
    // Aquí asumimos que el dueño YA DEBE EXISTIR. Si no, es riesgoso crearlo auto.
    const owner = await prisma.owner.findFirst({
      where: { name: { equals: data.ownerName, mode: 'insensitive' } }
    })

    if (!owner) {
      return { success: false, error: `Dueño no encontrado: ${data.ownerName}` }
    }

    // 3. CREAR PRODUCTO Y VARIANTE
    await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          categoryId: category.id,
          ownerId: owner.id,
          isActive: true
        }
      })

      await tx.productVariant.create({
        data: {
          productId: newProduct.id,
          name: "Estándar",
          costPrice: data.cost,
          salePrice: data.price,
          stock: 0, // Siempre nace en 0, luego se hace ingreso de stock
          imageUrl: null 
        }
      })
    })

    return { success: true }

  } catch (error: any) {
    console.error("Error importando:", error)
    return { success: false, error: error.message }
  }
}