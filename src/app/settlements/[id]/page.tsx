// src/app/settlements/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import SettlementTicket from "@/components/SettlementTicket"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function SettlementDetailPage({ params }: Props) {
  const { id } = await params

  // Buscamos la liquidación con TODO el detalle
  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      owner: true,
      items: {
        // ⚠️ CORRECCIÓN 1: Ordenamos por la fecha de la VENTA padre, no del item
        orderBy: { sale: { createdAt: 'desc' } },
        // ⚠️ CORRECCIÓN 2: Incluimos la venta para leer esa fecha
        include: { sale: true }
      },
      adjustments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!settlement) return notFound()

  // Mapeo de datos para el componente visual
  const formattedData = {
    ...settlement,
    totalAmount: Number(settlement.totalAmount),
    items: settlement.items.map(i => ({
        id: i.id,
        description: i.description,
        quantity: i.quantity,
        costAtSale: Number(i.costAtSale),
        // ⚠️ CORRECCIÓN 3: Extraemos la fecha desde la relación 'sale'
        createdAt: i.sale.createdAt 
    })),
    adjustments: settlement.adjustments.map(a => ({
        ...a,
        amount: Number(a.amount)
    }))
  }

  return (
    <SettlementTicket data={formattedData} />
  )
}