// src/actions/bulk-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth" 

// Definimos la estructura esperada
type ImportRow = {
  name: string
  variantName?: string 
  categoryName: string
  ownerName: string
  cost: number
  price: number
}

// Helper simple para convertir a Title Case
function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  )
}

/**
 * Lógica central de procesamiento de UN producto dentro de una transacción.
 * Se extrae para reutilización y consistencia.
 * Lanza errores para provocar rollback si algo falla.
 */
async function processProductRow(tx: any, data: ImportRow, rowIndex: number) {
    // 1. SANITIZACIÓN
    if (typeof data !== 'object' || data === null) {
        throw new Error(`Fila ${rowIndex}: Datos corruptos o formato inválido.`)
    }

    const name = String(data.name || "").trim()
    const categoryName = String(data.categoryName || "").trim()
    const ownerName = String(data.ownerName || "").trim()
    
    if (!name || !categoryName || !ownerName) {
        throw new Error(`Fila ${rowIndex} (${name}): Faltan datos obligatorios.`)
    }

    const cost = Number(data.cost)
    const price = Number(data.price)

    if (isNaN(cost) || isNaN(price)) {
        throw new Error(`Fila ${rowIndex} (${name}): Importes numéricos inválidos.`)
    }

    if (cost < 0 || price < 0) {
        throw new Error(`Fila ${rowIndex} (${name}): No se permiten importes negativos.`)
    }

    if (price < cost) {
        throw new Error(`Fila ${rowIndex} (${name}): Rentabilidad negativa (Precio < Costo).`)
    }

    const variantName = data.variantName && String(data.variantName).trim() !== "" 
        ? String(data.variantName).trim() 
        : "Estándar"

    // 2. DEPENDENCIAS
    // A. Dueño
    const owner = await tx.owner.findFirst({
        where: { name: { equals: ownerName, mode: 'insensitive' } }
    })

    if (!owner) {
        throw new Error(`Fila ${rowIndex}: Dueño desconocido "${ownerName}".`)
    }

    // B. Categoría (Upsert manual dentro de la TX)
    const normalizedCategory = toTitleCase(categoryName)
    let category = await tx.category.findFirst({
        where: { name: { equals: normalizedCategory, mode: 'insensitive' } }
    })

    if (!category) {
        category = await tx.category.create({
            data: { name: normalizedCategory } 
        })
    }

    // 3. PRODUCTO Y VARIANTE
    const existingProduct = await tx.product.findFirst({
        where: {
            name: { equals: name, mode: 'insensitive' },
            ownerId: owner.id
        }
    })

    if (existingProduct) {
        // Verificar variante
        const existingVariant = await tx.productVariant.findFirst({
            where: {
                productId: existingProduct.id,
                name: { equals: variantName, mode: 'insensitive' }
            }
        })

        if (!existingVariant) {
            await tx.productVariant.create({
                data: {
                    productId: existingProduct.id,
                    name: variantName,
                    costPrice: cost,
                    salePrice: price,
                    stock: 0,
                    imageUrl: null
                }
            })
        }
        // Si existe, lo omitimos silenciosamente (Idempotencia)
    } else {
        // Crear Padre + Hijo
        await tx.product.create({
            data: {
                name: name,
                categoryId: category.id,
                ownerId: owner.id,
                isActive: true,
                variants: {
                    create: {
                        name: variantName,
                        costPrice: cost,
                        salePrice: price,
                        stock: 0,
                        imageUrl: null
                    }
                }
            }
        })
    }
}

// --- ACTIONS PÚBLICAS ---

export async function importSingleProduct(data: ImportRow) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, error: "Requiere permisos de Administrador." }
    }

    // Reutilizamos la lógica envolviéndola en una transacción unitaria
    await prisma.$transaction(async (tx) => {
        await processProductRow(tx, data, 1)
    })

    return { success: true }

  } catch (error: any) {
    console.error("Error importando single:", error)
    return { success: false, error: error.message || "Error interno." }
  }
}

// R-03: Nueva acción para procesamiento por lotes
export async function importProductBatch(rows: ImportRow[]) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, error: "Requiere permisos de Administrador." }
    }

    if (!Array.isArray(rows) || rows.length === 0) {
        return { success: false, error: "Lote vacío o inválido." }
    }

    try {
        // Ejecutamos todo el lote en una única transacción atómica
        // Si una fila falla, todo el lote se revierte (All-or-Nothing)
        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < rows.length; i++) {
                // Pasamos i + 1 para que el mensaje de error tenga sentido humano (Fila 1, no Fila 0)
                await processProductRow(tx, rows[i], i + 1)
            }
        }, {
            timeout: 20000 // Aumentamos timeout a 20s para lotes grandes
        })

        return { success: true, count: rows.length }

    } catch (error: any) {
        console.error("Error en batch:", error)
        // Retornamos el error exacto que lanzó processProductRow
        return { success: false, error: error.message || "Error procesando el lote." }
    }
}