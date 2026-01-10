// src/actions/product-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProduct(formData: FormData) {
  // 1. Obtener datos simples
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const ownerId = formData.get("ownerId") as string
  const categoryId = formData.get("categoryId") as string
  const imageUrl = formData.get("imageUrl") as string // URL de Cloudinary
  
  // 2. Obtener y convertir números (Prisma usa Strings para Decimals, pero validamos aquí)
  const costPrice = parseFloat(formData.get("costPrice") as string)
  const salePrice = parseFloat(formData.get("salePrice") as string)

  // Validaciones básicas
  if (!name || !ownerId || !categoryId || !costPrice || !salePrice) {
    throw new Error("Faltan datos obligatorios")
  }

  try {
    // 3. LA TRANSACCIÓN (Todo o Nada)
    await prisma.$transaction(async (tx) => {
      
      // A. Crear el "Padre" (Producto genérico)
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          ownerId,
          categoryId,
          isActive: true
        }
      })

      // B. Crear el "Hijo" (Variante inicial)
      // Usamos el ID del padre que acabamos de crear (newProduct.id)
      await tx.productVariant.create({
        data: {
          productId: newProduct.id,
          name: "Estándar", // Por ahora, variante única por defecto
          imageUrl: imageUrl || null,
          costPrice: costPrice,
          salePrice: salePrice,
          stock: 0 // Regla de oro: Nace con stock 0. Se carga después.
        }
      })
    })

    // 4. Si todo salió bien
    revalidatePath("/products")

  } catch (error) {
    console.error("Error creando producto:", error)
    return { error: "Error al guardar el producto" }
  }
  
  // Redirigir al listado (fuera del try/catch)
  redirect("/products")
}

// --- AGREGAR AL FINAL DE src/actions/product-actions.ts ---

export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const categoryId = formData.get("categoryId") as string
  const ownerId = formData.get("ownerId") as string
  const costPrice = parseFloat(formData.get("costPrice") as string)
  const salePrice = parseFloat(formData.get("salePrice") as string)
  const imageUrl = formData.get("imageUrl") as string

  if (!id || !name || !costPrice || !salePrice) throw new Error("Datos faltantes")

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos base del producto
      await tx.product.update({
        where: { id },
        data: { name, description, categoryId, ownerId }
      })

      // 2. Actualizar precios en la variante (Asumimos variante única por ahora)
      // Primero buscamos la variante asociada a este producto
      const variant = await tx.productVariant.findFirst({ where: { productId: id } })
      
      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            costPrice,
            salePrice,
            // Si viene una imagen nueva, la actualizamos. Si viene vacía, NO la tocamos (mantenemos la vieja)
            ...(imageUrl ? { imageUrl } : {}) 
          }
        })
      }
    })

    revalidatePath("/products")
    revalidatePath("/pos") // Importante: actualizar precios en el punto de venta
    return { success: true }

  } catch (error) {
    console.error("Error actualizando:", error)
    return { error: "No se pudo actualizar el producto" }
  }
}

export async function toggleProductStatus(productId: string, currentStatus: boolean) {
  try {
    // REGLA DE ORO: No archivar si hay stock positivo
    if (currentStatus === true) { // Si queremos desactivar...
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