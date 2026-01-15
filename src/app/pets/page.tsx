// src/app/pets/page.tsx
import { prisma } from "@/lib/prisma"
import { createPet, deletePet } from "@/actions/pet-actions"
import Link from "next/link"
import SearchInput from "@/components/SearchInput"
import { cn } from "@/lib/utils"

interface Props {
  searchParams?: Promise<{ query?: string }>
}

export default async function PetsPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params?.query || ""

  const pets = await prisma.pet.findMany({
    where: query ? {
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { ownerName: { contains: query, mode: 'insensitive' } },
            { breed: { contains: query, mode: 'insensitive' } }
        ]
    } : undefined,
    orderBy: { name: 'asc' }
  })

  // Action inline wrapper
  async function handleDelete(formData: FormData) {
    'use server'
    const id = formData.get("id") as string
    await deletePet(id)
  }

  const inputClass = "w-full p-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none transition"
  const labelClass = "block text-xs font-bold text-muted-foreground uppercase mb-1.5"

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">Mascotas</h1>
        <p className="text-sm text-muted-foreground mt-1">Base de clientes caninos y felinos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-3xl shadow-sm border border-border sticky top-6">
            <h2 className="text-xl font-black text-foreground mb-6 font-nunito">🐕 Nueva Ficha</h2>
            <form action={createPet} className="space-y-4">
              <div>
                <label className={labelClass}>Nombre Mascota *</label>
                <input name="name" type="text" required placeholder="Ej: Bobby" className={inputClass}/>
              </div>
              <div>
                <label className={labelClass}>Raza</label>
                <input name="breed" type="text" placeholder="Ej: Caniche" className={inputClass}/>
              </div>
              <div className="pt-4 border-t border-border mt-4">
                <p className="text-xs text-primary font-bold mb-4 uppercase">Datos del Dueño</p>
                <div className="mb-4">
                    <label className={labelClass}>Nombre Humano *</label>
                    <input name="ownerName" type="text" required placeholder="Ej: Maria Perez" className={inputClass}/>
                </div>
                <div>
                    <label className={labelClass}>Teléfono / WhatsApp *</label>
                    <input name="ownerPhone" type="text" required placeholder="Ej: 11 1234 5678" className={inputClass}/>
                </div>
              </div>
              <div className="pt-2">
                <label className={labelClass}>Notas Generales</label>
                <textarea name="notes" rows={2} className={inputClass} placeholder="Ej: Alérgico al pollo"></textarea>
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-bold shadow-lg transition active:scale-95 mt-2">
                Guardar Ficha
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="lg:col-span-2 space-y-6">
          <SearchInput placeholder="Buscar por mascota, dueño o raza..." />

          <div className="grid gap-4">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border flex justify-between items-start hover:border-primary/50 transition duration-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-foreground">{pet.name}</h3>
                    <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2 py-0.5 rounded-lg uppercase">{pet.breed}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-bold">Dueño:</span> {pet.ownerName} 
                    <span className="mx-2 text-border">|</span>
                    <span className="text-green-600 dark:text-green-400 font-mono text-xs">📞 {pet.ownerPhone}</span>
                  </div>
                  {pet.notes && (
                    <p className="mt-3 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20 inline-block font-medium">
                      ⚠️ {pet.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <Link href={`/pets/${pet.id}`} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary/20 border border-primary/10 transition">
                        VER FICHA
                    </Link>
                    <form action={handleDelete}>
                        <input type="hidden" name="id" value={pet.id} />
                        <button type="submit" className="text-muted-foreground hover:text-destructive text-[10px] font-bold px-2 py-1 transition">
                            ELIMINAR
                        </button>
                    </form>
                </div>
              </div>
            ))}

            {pets.length === 0 && (
              <div className="text-center py-20 text-muted-foreground bg-card rounded-3xl border border-dashed border-border opacity-70">
                <span className="text-4xl block mb-2 opacity-50">🐕</span>
                {query ? "No encontré mascotas con ese nombre." : "No hay mascotas registradas."}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}