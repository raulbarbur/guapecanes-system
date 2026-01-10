// src/app/pets/page.tsx
import { prisma } from "@/lib/prisma"
import { createPet, deletePet } from "@/actions/pet-actions"
import Link from "next/link"

export default async function PetsPage() {
  // Listamos todas las mascotas ordenadas por nombre
  const pets = await prisma.pet.findMany({
    orderBy: { name: 'asc' }
  })

  // Server Action pequeña para el botón de borrar
  async function handleDelete(formData: FormData) {
    'use server'
    const id = formData.get("id") as string
    await deletePet(id)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Clientes (Mascotas)</h1>
        {/* Un pequeño menú de navegación temporal */}
        <div className="space-x-4 text-sm font-bold text-blue-600">
             <Link href="/dashboard" className="hover:underline">Dashboard</Link>
             <Link href="/agenda" className="hover:underline">Agenda</Link>
             <Link href="/products" className="hover:underline">Productos</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO DE ALTA */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow border sticky top-4">
            <h2 className="text-xl font-bold mb-4">Nueva Ficha</h2>
            <form action={createPet} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Mascota *</label>
                <input name="name" type="text" required placeholder="Ej: Bobby" className="w-full border p-2 rounded"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Raza</label>
                <input name="breed" type="text" placeholder="Ej: Caniche" className="w-full border p-2 rounded"/>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Datos del Dueño</p>
                
                <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700">Nombre Humano *</label>
                    <input name="ownerName" type="text" required placeholder="Ej: Maria Perez" className="w-full border p-2 rounded"/>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono / WhatsApp *</label>
                    <input name="ownerPhone" type="text" required placeholder="Ej: 11 1234 5678" className="w-full border p-2 rounded"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notas Generales (Alertas)</label>
                <textarea name="notes" rows={2} className="w-full border p-2 rounded" placeholder="Ej: Alérgico al pollo"></textarea>
              </div>

              <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 font-bold">
                Guardar Ficha
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="lg:col-span-2">
          <div className="grid gap-4">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-start hover:shadow-md transition">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800">{pet.name}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{pet.breed}</span>
                  </div>
                  
                  <div className="mt-1 text-sm text-gray-600">
                    <span className="font-semibold">Dueño:</span> {pet.ownerName} 
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-green-600 font-mono">📞 {pet.ownerPhone}</span>
                  </div>

                  {pet.notes && (
                    <p className="mt-2 text-xs text-gray-500 italic bg-yellow-50 p-2 rounded border border-yellow-100 inline-block">
                      ⚠️ {pet.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                    {/* BOTÓN VER FICHA (NUEVO) */}
                    <Link 
                        href={`/pets/${pet.id}`}
                        className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded hover:bg-purple-200 border border-purple-200"
                    >
                        VER FICHA
                    </Link>

                    <form action={handleDelete}>
                        <input type="hidden" name="id" value={pet.id} />
                        <button type="submit" className="text-red-300 hover:text-red-500 text-[10px] font-bold px-2 py-1 hover:underline">
                            ELIMINAR
                        </button>
                    </form>
                </div>
              </div>
            ))}

            {pets.length === 0 && (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded border border-dashed">
                No hay mascotas registradas.<br/>Usá el formulario de la izquierda.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}