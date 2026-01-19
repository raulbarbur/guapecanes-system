// src/app/owners/[id]/edit/page.tsx
//export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import OwnerForm from "@/components/OwnerForm"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditOwnerPage({ params }: Props) {
  const { id } = await params

  const owner = await prisma.owner.findUnique({
    where: { id }
  })

  if (!owner) return <div>Dueño no encontrado</div>

  return (
    <div className="p-10 max-w-lg mx-auto">
      <Link href="/owners" className="text-blue-500 mb-4 block hover:underline">← Volver al listado</Link>
      
      {/* Reutilizamos el formulario pasándole los datos */}
      <OwnerForm initialData={owner} />
    </div>
  )
}