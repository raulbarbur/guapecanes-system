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
    // 1. SANITIZACIÓN Y VALIDACIÓN PREVIA (Fail Fast)
    if (!data.name || !data.categoryName || !data.ownerName) {
      return { success: false, error: "Datos incompletos: Faltan Nombre, Categoría o Dueño." }
    }

    // Aseguramos que sean números (por si viene texto o vacío del Excel)
    const cost = Number(data.cost)
    const price = Number(data.price)

    if (isNaN(cost) || isNaN(price)) {
      return { success: false, error: "Formato inválido: Costo y Precio deben ser numéricos." }
    }

    // 2. REGLAS DE ORO (Validación de Negocio)
    if (cost < 0 || price < 0) {
      return { success: false, error: "Error financiero: No se permiten importes negativos." }
    }

    // Regla: Integridad de Rentabilidad (salvo que sea 0 y 0 para carga inicial pendiente)
    if (price < cost) {
      return { success: false, error: `Rentabilidad negativa: Costo ($${cost}) mayor a Venta ($${price}).` }
    }

    // 3. BUSCAR O CREAR CATEGORÍA
    // Buscamos exacto o insensible a mayúsculas para evitar duplicados como "Juguetes" y "juguetes"
    let category = await prisma.category.findFirst({
      where: { name: { equals: data.categoryName, mode: 'insensitive' } }
    })

    if (!category) {
      // Si no existe, la creamos (Normalizamos el nombre tal cual viene)
      category = await prisma.category.create({
        data: { name: data.categoryName } 
      })
    }

    // 4. VALIDAR DUEÑO EXISTENTE
    // Asumimos que el dueño YA DEBE EXISTIR en la base de datos.
    const owner = await prisma.owner.findFirst({
      where: { name: { equals: data.ownerName, mode: 'insensitive' } }
    })

    if (!owner) {
      return { success: false, error: `Dueño desconocido: "${data.ownerName}". Crealo antes de importar.` }
    }

    // 5. TRANSACCIÓN DB (Creación del Producto)
    await prisma.$transaction(async (tx) => {
      
      // A. Crear el Producto Padre
      const newProduct = await tx.product.create({
        data: {
          name: data.name,
          categoryId: category.id,
          ownerId: owner.id,
          isActive: true
        }
      })

      // B. Crear la Variante (Hijo)
      await tx.productVariant.create({
        data: {
          productId: newProduct.id,
          name: "Estándar",
          costPrice: cost,
          salePrice: price,
          stock: 0, // Regla: Siempre nace en 0. Se debe hacer Ingreso de Stock después.
          imageUrl: null 
        }
      })
    })

    return { success: true }

  } catch (error: any) {
    console.error("Error crítico importando:", error)
    // Devolvemos el mensaje limpio si es posible
    return { success: false, error: error.message || "Error interno del servidor" }
  }
}