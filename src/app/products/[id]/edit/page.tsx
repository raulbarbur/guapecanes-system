// src/app/products/[id]/edit/page.tsx
import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/ProductForm"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params

  // 1. Buscar datos maestros para los selectores
  const owners = await prisma.owner.findMany()
  const categories = await prisma.category.findMany()

  // 2. Buscar el producto a editar
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true }
  })

  if (!product) return <div>Producto no encontrado</div>

  // 3. Preparar los datos para el formulario
  const variant = product.variants[0] // Asumimos variante única
  const initialData = {
    id: product.id,
    name: product.name,
    description: product.description,
    ownerId: product.ownerId,
    categoryId: product.categoryId,
    costPrice: Number(variant.costPrice),
    salePrice: Number(variant.salePrice),
    imageUrl: variant.imageUrl
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
        <Link href="/products" className="text-blue-500 mb-4 block">← Cancelar y Volver</Link>
        <ProductForm 
            owners={owners} 
            categories={categories} 
            initialData={initialData} // 👈 Pasamos los datos
        />
    </div>
  )
}