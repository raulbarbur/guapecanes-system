// src/actions/bulk-actions.ts
'use server'

import { prisma } from "@/lib/prisma"

// Definimos la nueva estructura esperada (incluye variantName)
type ImportRow = {
  name: string
  variantName?: string // 👈 Campo nuevo opcional
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
    // 1. SANITIZACIÓN Y VALIDACIÓN (Fail Fast)
    if (!data.name || !data.categoryName || !data.ownerName) {
      return { success: false, error: "Datos incompletos: Faltan Nombre, Categoría o Dueño." }
    }

    const cost = Number(data.cost)
    const price = Number(data.price)

    if (isNaN(cost) || isNaN(price)) {
      return { success: false, error: "Formato inválido: Costo y Precio deben ser números." }
    }

    // 2. REGLAS FINANCIERAS (Guard Clauses)
    if (cost < 0 || price < 0) {
      return { success: false, error: "Error financiero: Importes negativos no permitidos." }
    }

    if (price < cost) {
      return { success: false, error: `Rentabilidad negativa: Costo ($${cost}) > Venta ($${price}).` }
    }

    // 3. NORMALIZAR DATOS
    const productName = data.name.trim()
    // Si no ponen variante, asumimos "Estándar"
    const variantName = data.variantName && data.variantName.trim() !== "" 
        ? data.variantName.trim() 
        : "Estándar"
    
    // 4. BUSCAR O CREAR ENTIDADES RELACIONADAS (Dueño y Categoría)
    
    // A. Dueño
    const owner = await prisma.owner.findFirst({
      where: { name: { equals: data.ownerName, mode: 'insensitive' } }
    })

    if (!owner) {
      return { success: false, error: `Dueño desconocido: "${data.ownerName}". Crealo en el sistema primero.` }
    }

    // B. Categoría (Upsert manual)
    const normalizedCategory = toTitleCase(data.categoryName.trim())
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
            name: { equals: productName, mode: 'insensitive' },
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
            return { success: false, error: `Omitido: Ya existe la variante "${variantName}" en "${productName}".` }
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
                name: productName,
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