// src/app/owners/page.tsx
import { createOwner } from "@/actions/owner-actions"
import { prisma } from "@/lib/prisma"

export default async function OwnersPage() {
  // Consultamos los dueños existentes para mostrarlos abajo
  const owners = await prisma.owner.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Gestión de Dueños</h1>

      {/* FORMULARIO DE ALTA */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-10">
        <h2 className="text-xl font-semibold mb-4">Nuevo Dueño</h2>
        {/* Al enviar, ejecutamos la Server Action createOwner */}
        <form action={createOwner} className="flex gap-4 items-end">
          
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Nombre *</label>
            <input 
              name="name" 
              type="text" 
              required 
              className="border p-2 rounded" 
              placeholder="Juan Pérez"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Email</label>
            <input 
              name="email" 
              type="email" 
              className="border p-2 rounded" 
              placeholder="juan@mail.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Teléfono</label>
            <input 
              name="phone" 
              type="text" 
              className="border p-2 rounded" 
              placeholder="11 1234 5678"
            />
          </div>

          <button 
            type="submit" 
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Guardar
          </button>
        </form>
      </div>

      {/* LISTADO DE DUEÑOS */}
      <div className="grid gap-4">
        {owners.map((owner) => (
          <div key={owner.id} className="border p-4 rounded flex justify-between bg-white shadow-sm">
            <div>
              <p className="font-bold text-lg">{owner.name}</p>
              <p className="text-gray-500 text-sm">{owner.email || "Sin email"} | {owner.phone || "Sin teléfono"}</p>
            </div>
            <span className="text-green-600 text-sm bg-green-100 px-2 py-1 rounded h-fit">
              Activo
            </span>
          </div>
        ))}
        
        {owners.length === 0 && (
          <p className="text-gray-500 text-center py-10">No hay dueños registrados aún.</p>
        )}
      </div>
    </div>
  )
}