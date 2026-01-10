// src/app/owners/page.tsx
import { prisma } from "@/lib/prisma"
import OwnerForm from "@/components/OwnerForm" // 👈 Usamos el componente nuevo
import Link from "next/link"

export default async function OwnersPage() {
  const owners = await prisma.owner.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestión de Dueños</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO ALTA */}
        <div className="md:col-span-1">
            <div className="sticky top-24">
                <OwnerForm /> {/* 👈 Formulario limpio, sin props es creación */}
            </div>
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="md:col-span-2 grid gap-4">
            {owners.map((owner) => (
            <div key={owner.id} className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-gray-800">{owner.name}</p>
                        {owner.isActive && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        📧 {owner.email || "Sin email"}
                    </p>
                    <p className="text-gray-500 text-sm">
                        📞 {owner.phone || "Sin teléfono"}
                    </p>
                </div>
                
                {/* BOTÓN EDITAR */}
                <Link 
                    href={`/owners/${owner.id}/edit`}
                    className="bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 px-4 py-2 rounded text-sm font-bold border transition"
                >
                    EDITAR
                </Link>
            </div>
            ))}
            
            {owners.length === 0 && (
            <div className="p-10 text-center text-gray-400 border-2 border-dashed rounded-lg">
                No hay dueños registrados.
            </div>
            )}
        </div>
      </div>
    </div>
  )
}