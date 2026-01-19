// src/app/customers/[id]/page.tsx

// 👇 CAMBIO REALIZADO AQUÍ 👇
// Forzar el renderizado dinámico para evitar el conflicto con el middleware durante el build.
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import CustomerForm from "@/components/CustomerForm"
import CustomerSaleRow from "@/components/CustomerSaleRow"

interface Props {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: { 
            items: true 
        }
      }
    }
  })

  if (!customer) return notFound()

  // FIX: Serialización de Decimales a Number/String para evitar errores de Client Component
  // Transformamos el objeto customer y sus relaciones profundamente
  const serializedCustomer = {
      ...customer,
      sales: customer.sales.map(sale => ({
          ...sale,
          total: Number(sale.total), // Decimal -> Number
          items: sale.items.map(item => ({
              ...item,
              priceAtSale: Number(item.priceAtSale), // Decimal -> Number
              costAtSale: Number(item.costAtSale)    // Decimal -> Number
          }))
      }))
  }

  // Cálculos usando los datos serializados
  const totalDebt = serializedCustomer.sales
    .filter(s => s.paymentStatus === 'PENDING')
    .reduce((sum, s) => sum + s.total, 0)

  const lifetimeValue = serializedCustomer.sales
    .reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
            <Link href="/customers" className="text-xs font-bold text-primary hover:underline mb-2 block">← Volver al listado</Link>
            <h1 className="text-4xl font-black text-foreground font-nunito">{customer.name}</h1>
            <div className="mt-2 text-muted-foreground flex gap-4 text-sm font-medium">
                {customer.phone && <span>📞 {customer.phone}</span>}
                {customer.email && <span>📧 {customer.email}</span>}
            </div>
            {customer.address && <p className="text-sm text-muted-foreground mt-1">📍 {customer.address}</p>}
        </div>

        {/* TARJETA DE DEUDA */}
        <div className={cn(
            "p-6 rounded-3xl shadow-lg border min-w-[280px]",
            totalDebt > 0 
                ? 'bg-destructive text-destructive-foreground border-destructive/50' 
                : 'bg-card text-foreground border-border'
        )}>
            <p className="text-xs font-bold uppercase opacity-80 mb-1">
                {totalDebt > 0 ? "Deuda Pendiente" : "Estado de Cuenta"}
            </p>
            <p className="text-4xl font-black tracking-tight mb-2">
                ${totalDebt.toLocaleString()}
            </p>
            {totalDebt === 0 ? (
                <div className="inline-block bg-green-500/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-lg text-xs font-bold">
                    ✅ AL DÍA
                </div>
            ) : (
                <p className="text-xs opacity-90">El cliente debe abonar este monto.</p>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: EDICIÓN + ESTADÍSTICAS */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Compras Totales</p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                    ${lifetimeValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{customer.sales.length} operaciones registradas</p>
            </div>

            {/* Pasamos el objeto limpio sin Decimals */}
            <CustomerForm initialData={serializedCustomer} />
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                📜 Historial de Cuenta
            </h2>
            
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4 pl-6">Fecha</th>
                                <th className="p-4">Resumen Compra</th>
                                <th className="p-4 text-right">Monto</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {serializedCustomer.sales.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        Sin movimientos registrados.
                                    </td>
                                </tr>
                            ) : (
                                serializedCustomer.sales.map(sale => (
                                    <CustomerSaleRow key={sale.id} sale={sale} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}