// src/actions/bulk-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth" // 👈 Importamos seguridad

// Definimos la nueva estructura esperada (incluye variantName)
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

export async function importSingleProduct(data: ImportRow) {
  try {
    // 0. SEGURIDAD (R-03: Defensa en Profundidad)
    const session = await getSession()
    if (!session) {
        return { success: false, error: "No autorizado. Sesión inválida." }
    }

    // 1. SANITIZACIÓN Y VALIDACIÓN (R-04: Validación estricta de tipos)
    if (typeof data !== 'object' || data === null) {
        return { success: false, error: "Datos corruptos o formato inválido." }
    }

    // Convertimos explícitamente a string y limpiamos espacios
    const name = String(data.name || "").trim()
    const categoryName = String(data.categoryName || "").trim()
    const ownerName = String(data.ownerName || "").trim()
    
    // Validación de campos vacíos
    if (!name || !categoryName || !ownerName) {
      return { success: false, error: "Faltan datos: Nombre, Categoría o Dueño." }
    }

    // Conversión segura de números
    const cost = Number(data.cost)
    const price = Number(data.price)

    if (isNaN(cost) || isNaN(price)) {
      return { success: false, error: `Importes inválidos para producto "${name}".` }
    }

    // 2. REGLAS FINANCIERAS (Guard Clauses)
    if (cost < 0 || price < 0) {
      return { success: false, error: "Error financiero: Importes negativos no permitidos." }
    }

    if (price < cost) {
      return { success: false, error: `Rentabilidad negativa: Costo ($${cost}) > Venta ($${price}).` }
    }

    // 3. NORMALIZAR DATOS
    const variantName = data.variantName && String(data.variantName).trim() !== "" 
        ? String(data.variantName).trim() 
        : "Estándar"
    
    // 4. BUSCAR O CREAR ENTIDADES RELACIONADAS (Dueño y Categoría)
    
    // A. Dueño
    const owner = await prisma.owner.findFirst({
      where: { name: { equals: ownerName, mode: 'insensitive' } }
    })

    if (!owner) {
      return { success: false, error: `Dueño desconocido: "${ownerName}". Crealo en el sistema primero.` }
    }

    // B. Categoría (Upsert manual)
    const normalizedCategory = toTitleCase(categoryName)
    let category = await prisma.category.findFirst({
      where: { name: { equals: normalizedCategory, mode: 'insensitive' } }
    })

    if (!category) {
      category = await prisma.category.create({
        data: { name: normalizedCategory } 
      })
    }

    // 5. LÓGICA CORE: PADRE E HIJO
    
    // Buscamos si el Producto Padre ya existe para este dueño
    const existingProduct = await prisma.product.findFirst({
        where: {
            name: { equals: name, mode: 'insensitive' },
            ownerId: owner.id
        }
    })

    if (existingProduct) {
        // CASO A: EL PRODUCTO EXISTE -> Intentamos agregar la VARIANTE
        
        // Verificamos si YA existe esa variante específica
        const existingVariant = await prisma.productVariant.findFirst({
            where: {
                productId: existingProduct.id,
                name: { equals: variantName, mode: 'insensitive' }
            }
        })

        if (existingVariant) {
            return { success: false, error: `Omitido: Ya existe la variante "${variantName}" en "${name}".` }
        }

        // Crear la variante nueva en el producto existente
        await prisma.productVariant.create({
            data: {
                productId: existingProduct.id,
                name: variantName,
                costPrice: cost,
                salePrice: price,
                stock: 0, // Siempre nace en 0
                imageUrl: null
            }
        })

    } else {
        // CASO B: EL PRODUCTO NO EXISTE -> Creamos PADRE + HIJO
        
        await prisma.product.create({
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

    return { success: true }

  } catch (error: any) {
    console.error("Error importando:", error)
    return { success: false, error: error.message || "Error interno del servidor" }
  }
}