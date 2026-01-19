export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import OwnerForm from "@/components/OwnerForm" 
import SearchInput from "@/components/SearchInput" 
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/shared/PageHeader"
import { AppCard } from "@/components/ui/shared/AppCard"

interface Props {
  searchParams?: Promise<{ query?: string }>
}

export default async function OwnersPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params?.query || ""

  const owners = await prisma.owner.findMany({
    where: query ? {
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
        ]
    } : undefined,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      
      {/* HEADER REUTILIZABLE */}
      <PageHeader 
        title="Gestión de Dueños"
        description="Base de datos de clientes y proveedores."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO ALTA */}
        <div className="lg:col-span-1">
            {/* Asumo que OwnerForm tiene su propia tarjeta interna. 
                Si se ve "desnudo", lo envolveremos en un AppCard en el futuro. */}
            <OwnerForm /> 
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="lg:col-span-2 space-y-6">
            <SearchInput placeholder="Buscar por nombre, mail o teléfono..." />

            <div className="grid gap-3">
                {owners.map((owner) => (
                    // Usamos AppCard como ítem de lista (interactive)
                    <Link key={owner.id} href={`/owners/${owner.id}`}>
                        <AppCard 
                            hoverEffect 
                            noPadding 
                            className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl"
                        >
                            {/* INFO */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    {owner.name.slice(0,2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-lg text-foreground truncate">
                                            {owner.name}
                                        </p>
                                        <span className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            owner.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-destructive"
                                        )} title={owner.isActive ? "Activo" : "Inactivo"}></span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs text-muted-foreground mt-0.5 truncate">
                                        {owner.email && <span>📧 {owner.email}</span>}
                                        {owner.phone && <span>📞 {owner.phone}</span>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* BADGE "VER PERFIL" (Visual only, whole card is link) */}
                            <div className="hidden sm:block">
                                <span className="bg-secondary text-foreground px-3 py-1.5 rounded-lg text-xs font-bold border border-border">
                                    Ver Perfil
                                </span>
                            </div>
                        </AppCard>
                    </Link>
                ))}
                
                {owners.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-muted/10 animate-in fade-in">
                        <span className="text-4xl block mb-2 opacity-50">👥</span>
                        <p className="font-medium">
                            {query ? "No se encontraron dueños con ese criterio." : "No hay dueños registrados aún."}
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}