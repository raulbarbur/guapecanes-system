// src/actions/product-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProduct(formData: FormData) {
  // 1. Obtener datos
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const ownerId = formData.get("ownerId") as string
  const categoryId = formData.get("categoryId") as string
  const imageUrl = formData.get("imageUrl") as string 
  
  // Convertir números
  const costPrice = parseFloat(formData.get("costPrice") as string)
  const salePrice = parseFloat(formData.get("salePrice") as string)

  // 2. VALIDACIONES DE SISTEMA
  if (!name || !ownerId || !categoryId) {
    return { error: "Faltan datos obligatorios (Nombre, Dueño o Categoría)" }
  }

  if (isNaN(costPrice) || isNaN(salePrice)) {
    return { error: "Los precios deben ser números válidos." }
  }

  // 3. VALIDACIONES DE NEGOCIO (Reglas de Oro)
  if (costPrice < 0 || salePrice < 0) {
    return { error: "Los precios no pueden ser negativos." }
  }

  // Regla: No vender a pérdida (salvo excepciones, pero por defecto protegemos)
  if (salePrice < costPrice) {
    return { error: `ERROR DE RENTABILIDAD: Estás vendiendo a $${salePrice} algo que costó $${costPrice}.` }
  }

  try {
    // 4. LA TRANSACCIÓN
    await prisma.$transaction(async (tx) => {
      // A. Crear Producto
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          ownerId,
          categoryId,
          isActive: true
        }
      })

      // B. Crear Variante Inicial (Stock 0 siempre)
      await tx.productVariant.create({
        data: {
          productId: newProduct.id,
          name: "Estándar",
          imageUrl: imageUrl || null,
          costPrice: costPrice,
          salePrice: salePrice,
          stock: 0 
        }
      })
    })

    revalidatePath("/products")

  } catch (error) {
    console.error("Error creando producto:", error)
    return { error: "Error interno al guardar el producto." }
  }
  
  // 5. Redirección exitosa (fuera del try/catch)
  redirect("/products")
}

export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const categoryId = formData.get("categoryId") as string
  const ownerId = formData.get("ownerId") as string
  const imageUrl = formData.get("imageUrl") as string
  
  const costPrice = parseFloat(formData.get("costPrice") as string)
  const salePrice = parseFloat(formData.get("salePrice") as string)

  if (!id || !name) return { error: "Datos faltantes" }

  // Validaciones de Negocio también al editar
  if (isNaN(costPrice) || isNaN(salePrice)) return { error: "Precios inválidos" }
  if (costPrice < 0 || salePrice < 0) return { error: "Precios negativos no permitidos" }
  if (salePrice < costPrice) return { error: `Rentabilidad negativa: Costo $${costPrice} > Venta $${salePrice}` }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar producto base
      await tx.product.update({
        where: { id },
        data: { name, description, categoryId, ownerId }
      })

      // 2. Actualizar precios en la variante
      const variant = await tx.productVariant.findFirst({ where: { productId: id } })
      
      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            costPrice,
            salePrice,
            ...(imageUrl ? { imageUrl } : {}) 
          }
        })
      }
    })

    revalidatePath("/products")
    revalidatePath("/pos") 
    return { success: true }

  } catch (error) {
    console.error("Error actualizando:", error)
    return { error: "No se pudo actualizar el producto" }
  }
}

export async function toggleProductStatus(productId: string, currentStatus: boolean) {
  try {
    // REGLA DE ORO: No archivar si hay stock positivo
    if (currentStatus === true) { 
      const variant = await prisma.productVariant.findFirst({ where: { productId } })
      if (variant && variant.stock > 0) {
        return { error: "No se puede archivar un producto con stock. Hacé un retiro o ajuste a 0 primero." }
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