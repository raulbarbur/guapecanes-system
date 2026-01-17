// src/app/customers/page.tsx
import { prisma } from "@/lib/prisma"
import CustomerForm from "@/components/CustomerForm"
import SearchInput from "@/components/SearchInput"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Props {
  searchParams?: Promise<{ query?: string }>
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params?.query || ""

  // 1. OBTENER CLIENTES Y SU DEUDA PENDIENTE
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
            status: 'COMPLETED',       // Venta válida
            paymentStatus: 'PENDING'   // Que no se haya pagado
        },
        select: { total: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  // 2. CALCULAR SALDOS EN MEMORIA
  const customersWithDebt = customers.map(c => {
    const debt = c.sales.reduce((sum, sale) => sum + Number(sale.total), 0)
    return { ...c, currentDebt: debt }
  })

  // Ordenar: Primero los deudores
  customersWithDebt.sort((a, b) => b.currentDebt - a.currentDebt)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">Clientes y Ctas. Corrientes</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de compradores y deudas por fiado.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: ALTA RÁPIDA */}
        <div className="lg:col-span-1">
            <CustomerForm />
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="lg:col-span-2 space-y-6">
            <SearchInput placeholder="Buscar por nombre, tel o email..." />

            <div className="grid gap-4">
                {customersWithDebt.map((customer) => (
                <div key={customer.id} className="group bg-card border border-border p-4 rounded-2xl hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    
                    {/* INFO */}
                    <Link href={`/customers/${customer.id}`} className="flex-1 cursor-pointer w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {customer.name.slice(0,2).toUpperCase()}
                            </div>
                            
                            <div>
                                <p className="font-bold text-lg text-foreground group-hover:text-primary transition">
                                    {customer.name}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs text-muted-foreground mt-0.5 font-medium">
                                    {customer.phone && <span>📞 {customer.phone}</span>}
                                    {customer.email && <span>📧 {customer.email}</span>}
                                </div>
                            </div>
                        </div>
                    </Link>
                    
                    {/* ESTADO DE CUENTA */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        
                        {/* Badge Deuda */}
                        {customer.currentDebt > 0 ? (
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">Deuda</p>
                                <p className="text-lg font-black text-destructive leading-none">
                                    ${customer.currentDebt.toLocaleString()}
                                </p>
                            </div>
                        ) : (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                Al Día
                            </span>
                        )}

                        {/* Botón */}
                        <Link 
                            href={`/customers/${customer.id}`}
                            className="bg-secondary hover:bg-accent text-foreground px-4 py-2 rounded-xl text-xs font-bold border border-border transition"
                        >
                            Ver Cuenta
                        </Link>
                    </div>
                </div>
                ))}
                
                {customers.length === 0 && (
                <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-muted/20">
                    <span className="text-4xl block mb-2 opacity-50">👥</span>
                    {query ? "No se encontraron clientes." : "Aún no hay clientes registrados."}
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}