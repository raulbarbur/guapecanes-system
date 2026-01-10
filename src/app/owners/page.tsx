// src/app/owners/page.tsx
import { prisma } from "@/lib/prisma"
import OwnerForm from "@/components/OwnerForm" 
import SearchInput from "@/components/SearchInput" 
import Link from "next/link"

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
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Dueños</h1>
      </div>

      <div className="mb-8 max-w-md">
        <SearchInput placeholder="Buscar por nombre, mail o teléfono..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO ALTA */}
        <div className="md:col-span-1">
            <div className="sticky top-6">
                <OwnerForm /> 
            </div>
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="md:col-span-2 grid gap-4">
            {owners.map((owner) => (
            <div key={owner.id} className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition flex justify-between items-center group">
                {/* Click en toda el área (excepto botones) lleva al perfil */}
                <Link href={`/owners/${owner.id}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition">
                            {owner.name}
                        </p>
                        {owner.isActive ? (
                            <span className="w-2 h-2 rounded-full bg-green-500" title="Activo"></span>
                        ) : (
                            <span className="w-2 h-2 rounded-full bg-red-500" title="Inactivo"></span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        📧 {owner.email || "Sin email"}
                    </p>
                    <p className="text-gray-500 text-sm">
                        📞 {owner.phone || "Sin teléfono"}
                    </p>
                </Link>
                
                {/* BOTÓN PERFIL */}
                <div className="flex gap-2">
                    <Link 
                        href={`/owners/${owner.id}`}
                        className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-black transition"
                    >
                        PERFIL
                    </Link>
                </div>
            </div>
            ))}
            
            {owners.length === 0 && (
            <div className="p-10 text-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50">
                {query ? "No se encontraron dueños." : "No hay dueños registrados."}
            </div>
            )}
        </div>
      </div>
    </div>
  )
}