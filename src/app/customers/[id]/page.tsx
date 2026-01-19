import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import CustomerForm from "@/components/CustomerForm"
import CustomerSaleRow from "@/components/CustomerSaleRow"
import { InfoCard } from "@/components/ui/InfoCard" // << IMPORTAR

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

  // Serialización segura
  const serializedCustomer = {
      ...customer,
      sales: customer.sales.map(sale => ({
          ...sale,
          total: Number(sale.total),
          items: sale.items.map(item => ({
              ...item,
              priceAtSale: Number(item.priceAtSale),
              costAtSale: Number(item.costAtSale)
          }))
      }))
  }

  const totalDebt = serializedCustomer.sales
    .filter(s => s.paymentStatus === 'PENDING')
    .reduce((sum, s) => sum + s.total, 0)

  const lifetimeValue = serializedCustomer.sales
    .reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      
      {/* HEADER REFACTORIZADO CON INFOCARDS */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
            <div>
                <Link href="/customers" className="text-xs font-bold text-primary hover:underline mb-2 block">← Volver al listado</Link>
                <h1 className="text-3xl md:text-4xl font-black text-foreground font-nunito">{customer.name}</h1>
            </div>
            
            {/* TARJETA DE DEUDA (Compacta) */}
            <div className={cn(
                "px-4 py-2 rounded-xl border flex flex-col items-end",
                totalDebt > 0 
                    ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                    : 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
            )}>
                <p className="text-[10px] font-bold uppercase opacity-80">Saldo</p>
                <p className="text-2xl font-black tracking-tight">${totalDebt.toLocaleString()}</p>
            </div>
        </div>

        {/* GRILLA DE CONTACTO */}
        <div className="flex flex-wrap gap-3">
            <InfoCard icon="📞" label="Teléfono" value={customer.phone} />
            <InfoCard icon="📧" label="Email" value={customer.email} />
            <InfoCard icon="📍" label="Dirección" value={customer.address} className="md:min-w-[200px]" />
            <div className="ml-auto hidden md:block">
                 <div className="bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 text-right">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">LTV (Total Gastado)</p>
                    <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                        ${lifetimeValue.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-1">
            <CustomerForm initialData={serializedCustomer} />
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                📜 Historial ({serializedCustomer.sales.length})
            </h2>
            
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col max-h-[600px]">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm relative">
                        <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-xs sticky top-0 z-10">
                            <tr>
                                <th className="p-4 pl-6">Fecha</th>
                                <th className="p-4">Resumen</th>
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