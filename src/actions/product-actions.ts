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