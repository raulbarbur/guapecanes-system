//export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import CustomerForm from "@/components/CustomerForm"
import SearchInput from "@/components/SearchInput"
import Link from "next/link"
import { PageHeader } from "@/components/ui/shared/PageHeader"
import { AppCard } from "@/components/ui/shared/AppCard"
import { cn } from "@/lib/utils"

interface Props {
  searchParams?: Promise<{ query?: string }>
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params?.query || ""

  const customers = await prisma.customer.findMany({
    where: query ? {
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
        ]
    } : undefined,
    include: {
      sales: {
        where: { 
            status: 'COMPLETED',
            paymentStatus: 'PENDING'
        },
        select: { total: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  const customersWithDebt = customers.map(c => {
    const debt = c.sales.reduce((sum, sale) => sum + Number(sale.total), 0)
    return { ...c, currentDebt: debt }
  })

  // Ordenar: Primero los deudores
  customersWithDebt.sort((a, b) => b.currentDebt - a.currentDebt)

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      
      {/* HEADER */}
      <PageHeader 
        title="Cartera de Clientes"
        description="Gestión de cuentas corrientes y perfiles de contacto."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* COLUMNA IZQUIERDA: ALTA RÁPIDA */}
        <div className="xl:col-span-1 order-2 xl:order-1">
            {/* Si CustomerForm tiene padding interno, lo envolvemos en Card si no lo tiene. 
                Asumo que se mantiene igual que en Owners */}
            <CustomerForm />
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6 order-1 xl:order-2">
            <SearchInput placeholder="🔍 Buscar cliente..." />

            <div className="grid gap-3">
                {customersWithDebt.map((customer) => (
                    <Link key={customer.id} href={`/customers/${customer.id}`}>
                        <AppCard 
                            hoverEffect 
                            noPadding 
                            className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl"
                        >
                            {/* INFO */}
                            <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                                    {customer.name.slice(0,2).toUpperCase()}
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-lg text-foreground truncate">
                                        {customer.name}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-3 text-xs text-muted-foreground font-medium truncate">
                                        {customer.phone && <span className="flex items-center gap-1">📞 {customer.phone}</span>}
                                        {customer.email && <span className="flex items-center gap-1">📧 {customer.email}</span>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* ESTADO DE CUENTA */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-dashed border-border pt-3 sm:pt-0 mt-2 sm:mt-0">
                                
                                {/* Badge Deuda */}
                                {customer.currentDebt > 0 ? (
                                    <div className="text-left sm:text-right">
                                        <p className="text-[9px] font-black text-destructive uppercase tracking-wide opacity-80">Deuda Pendiente</p>
                                        <p className="text-xl font-black text-destructive leading-none">
                                            ${customer.currentDebt.toLocaleString()}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg border border-green-500/20 flex items-center gap-2">
                                        <span className="text-xs font-black">AL DÍA</span>
                                        <span className="text-xs">✨</span>
                                    </div>
                                )}

                                {/* Botón "Fake" (Toda la card es link) */}
                                <div className="hidden sm:block">
                                    <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
                                        Ver Cuenta →
                                    </span>
                                </div>
                            </div>
                        </AppCard>
                    </Link>
                ))}
                
                {customers.length === 0 && (
                     <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-muted/10 animate-in fade-in">
                        <span className="text-4xl block mb-2 opacity-50">👥</span>
                        <p className="font-medium">
                            {query ? "No se encontraron clientes." : "Base de datos de clientes vacía."}
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}