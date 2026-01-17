// src/actions/product-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth" // 👈 Importamos seguridad

// --- TIPOS INTERNOS ---
type VariantInput = {
    id?: string
    name: string
    costPrice: number
    salePrice: number
}

// --- HELPERS DE VALIDACIÓN ---

// 1. Resolver Categoría (Existente o Nueva)
async function resolveCategoryId(formData: FormData): Promise<string | null> {
    const isNewCategory = formData.get("isNewCategory") === "true"
    if (isNewCategory) {
        const newName = formData.get("categoryName") as string
        if (!newName || newName.trim() === "") return null
        
        // Buscamos case-insensitive para no duplicar "Juguetes" y "juguetes"
        const existing = await prisma.category.findFirst({
            where: { name: { equals: newName, mode: 'insensitive' } }
        })
        if (existing) return existing.id
        
        const created = await prisma.category.create({ data: { name: newName.trim() } })
        return created.id
    }
    return formData.get("categoryId") as string
}

// 2. Validar Reglas de Negocio Financieras
function validateVariants(variants: VariantInput[]): string | null {
    if (!Array.isArray(variants) || variants.length === 0) {
        return "Debe haber al menos una variante."
    }

    for (const v of variants) {
        const cost = Number(v.costPrice)
        const price = Number(v.salePrice)

        // A. Validación de Tipo
        if (isNaN(cost) || isNaN(price)) {
            return `Error en variante "${v.name}": Precios inválidos.`
        }

        // B. Validación de Signo (No negativos)
        if (cost < 0 || price < 0) {
            return `Error en variante "${v.name}": Los importes no pueden ser negativos.`
        }

        // C. Regla de Oro: Rentabilidad (Precio >= Costo)
        if (price < cost) {
            return `Rentabilidad negativa en "${v.name}". Costo ($${cost}) es mayor a Venta ($${price}).`
        }

        // D. Validación de Nombre
        if (!v.name || v.name.trim() === "") {
            return "Todas las variantes deben tener un nombre."
        }
    }

    return null // null significa que pasó todas las validaciones
}


// --- ACTIONS PÚBLICAS PROTEGIDAS ---

export async function createProduct(formData: FormData) {
  // R-03: Verificación de sesión
  const session = await getSession()
  if (!session) return { error: "Sesión expirada. Por favor, logueate nuevamente." }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const ownerId = formData.get("ownerId") as string
  const imageUrl = formData.get("imageUrl") as string 
  const variantsJson = formData.get("variantsJson") as string

  // 1. Validaciones de Estructura
  const categoryId = await resolveCategoryId(formData)
  if (!name || !ownerId || !categoryId) return { error: "Faltan datos obligatorios." }

  let variants: VariantInput[] = []
  try {
    variants = JSON.parse(variantsJson || "[]")
  } catch (e) {
    return { error: "Error procesando variantes (JSON inválido)." }
  }

  // 2. Validaciones de Negocio (Fail Fast)
  const validationError = validateVariants(variants)
  if (validationError) {
      return { error: validationError }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 3. Crear Producto Cabecera
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          ownerId,
          categoryId,
          isActive: true
        }
      })

      // 4. Crear Variantes
      for (const v of variants) {
        await tx.productVariant.create({
            data: {
                productId: newProduct.id,
                name: v.name,
                imageUrl: imageUrl || null,
                costPrice: v.costPrice,
                salePrice: v.salePrice,
                stock: 0 
            }
        })
      }
    })

    revalidatePath("/products")
  } catch (error) {
    console.error("Error creando:", error)
    return { error: "Error interno al guardar producto." }
  }
  
  redirect("/products")
}

export async function updateProduct(formData: FormData) {
  // R-03: Verificación de sesión
  const session = await getSession()
  if (!session) return { error: "No autorizado." }

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const ownerId = formData.get("ownerId") as string
  const imageUrl = formData.get("imageUrl") as string
  const variantsJson = formData.get("variantsJson") as string
  
  const categoryId = await resolveCategoryId(formData)
  if (!id || !name || !categoryId) return { error: "Datos faltantes" }

  let variants: VariantInput[] = []
  try {
    variants = JSON.parse(variantsJson || "[]")
  } catch (e) {
    return { error: "Error en variantes." }
  }

  // 1. Validaciones de Negocio (Fail Fast)
  const validationError = validateVariants(variants)
  if (validationError) {
      return { error: validationError }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 2. Actualizar Cabecera
      await tx.product.update({
        where: { id },
        data: { name, description, categoryId, ownerId }
      })

      // 3. Upsert Manual de Variantes
      for (const v of variants) {
        if (v.id) {
            await tx.productVariant.update({
                where: { id: v.id },
                data: {
                    name: v.name,
                    costPrice: v.costPrice,
                    salePrice: v.salePrice,
                    imageUrl: imageUrl || undefined 
                }
            })
        } else {
            await tx.productVariant.create({
                data: {
                    productId: id,
                    name: v.name,
                    costPrice: v.costPrice,
                    salePrice: v.salePrice,
                    stock: 0,
                    imageUrl: imageUrl || null
                }
            })
        }
      }
    })

    revalidatePath("/products")
    revalidatePath("/pos") 
    return { success: true }

  } catch (error: any) {
    console.error("Error actualizando:", error)
    if (error.code === 'P2002') {
        return { error: "No pueden haber dos variantes con el mismo nombre." }
    }
    return { error: "No se pudo actualizar el producto." }
  }
}

export async function toggleProductStatus(productId: string, currentStatus: boolean) {
  // R-03: Verificación de sesión
  const session = await getSession()
  if (!session) return { error: "No autorizado." }

  try {
    if (currentStatus === true) { 
      const variantWithStock = await prisma.productVariant.findFirst({ 
        where: { productId, stock: { gt: 0 } }
      })
      if (variantWithStock) {
        return { error: "No se puede archivar: Hay variantes con stock." }
      }
    }
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: !currentStatus }
    })
    revalidatePath("/products")
    revalidatePath("/pos")
    return { success: true }
  } catch (error) {
    return { error: "Error cambiando estado" }
  }
}