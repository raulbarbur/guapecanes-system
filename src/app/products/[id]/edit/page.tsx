// src/app/products/[id]/edit/page.tsx
//export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/ProductForm"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params

  // 1. Buscar datos maestros
  const owners = await prisma.owner.findMany()
  const categories = await prisma.category.findMany()

  // 2. Buscar el producto CON TODAS sus variantes
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { name: 'asc' } } } // Ordenamos por nombre
  })

  if (!product) return <div>Producto no encontrado</div>

  // 3. Estructura de datos para el form
  const initialData = {
    id: product.id,
    name: product.name,
    description: product.description,
    ownerId: product.ownerId,
    categoryId: product.categoryId,
    imageUrl: product.variants[0]?.imageUrl || "", // Tomamos la foto de la primera como referencia
    // Pasamos el array completo de variantes
    variants: product.variants.map(v => ({
      id: v.id,
      name: v.name,
      costPrice: Number(v.costPrice),
      salePrice: Number(v.salePrice),
      stock: v.stock
    }))
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
        <Link href="/products" className="text-blue-500 mb-4 block font-bold">← Cancelar y Volver</Link>
        <ProductForm 
            owners={owners} 
            categories={categories} 
            initialData={initialData} 
        />
    </div>
  )
}