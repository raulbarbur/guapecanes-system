// src/app/settlements/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import SettlementTicket from "@/components/SettlementTicket"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function SettlementDetailPage({ params }: Props) {
  const { id } = await params

  // Buscamos la liquidación con la nueva estructura de tablas intermedias
  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      owner: true,
      items: {
        // CORRECCIÓN: Ordenamos navegando la relación (Line -> Item -> Sale)
        orderBy: {
            saleItem: {
                sale: { createdAt: 'desc' }
            }
        },
        // En el nuevo esquema, 'items' son líneas de liquidación (SettlementLine)
        include: {
          saleItem: {
            include: {
              sale: true // Necesitamos la fecha de la venta original
            }
          }
        }
      },
      adjustments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!settlement) return notFound()

  // Mapeamos los datos al formato que espera el componente visual (SettlementTicket)
  const formattedData = {
    id: settlement.id,
    createdAt: settlement.createdAt,
    totalAmount: Number(settlement.totalAmount),
    owner: settlement.owner,
    
    // Transformamos las líneas de liquidación
    items: settlement.items.map(line => ({
        id: line.id,
        // La descripción vive en el item de venta original
        description: line.saleItem.description,
        // La cantidad es la de ESTA liquidación (puede ser parcial)
        quantity: line.quantity,
        // El costo unitario histórico
        costAtSale: Number(line.saleItem.costAtSale),
        // La fecha de la venta original
        createdAt: line.saleItem.sale.createdAt 
    })), // El sort ya lo hicimos en DB, pero no está de más mantener el orden del array

    adjustments: settlement.adjustments.map(a => ({
        ...a,
        amount: Number(a.amount)
    }))
  }

  return (
    <SettlementTicket data={formattedData} />
  )
}