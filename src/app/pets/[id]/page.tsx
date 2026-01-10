// src/app/pets/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { createNote, deleteNote } from "@/actions/note-actions"
import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PetDetailPage({ params }: Props) {
  const { id } = await params

  // 1. Buscamos la Mascota con TODO su historial (Turnos y Notas)
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { startTime: 'desc' } // Los más recientes primero
      },
      groomingNotes: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!pet) return <div className="p-10">Mascota no encontrada</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* CABECERA DE PERFIL */}
      <div className="mb-8 flex items-center justify-between">
        <div>
            <Link href="/pets" className="text-sm text-blue-600 hover:underline mb-2 block">← Volver al listado</Link>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                {pet.name}
                <span className="text-lg font-normal bg-gray-100 text-gray-600 px-3 py-1 rounded-full border">
                    {pet.breed || "Mestizo"}
                </span>
            </h1>
            <div className="mt-2 text-gray-600 flex gap-4 text-sm">
                <p>👤 Dueño: <strong>{pet.ownerName}</strong></p>
                <p>📞 Tel: <strong>{pet.ownerPhone}</strong></p>
            </div>
            {pet.notes && (
                <p className="mt-3 text-red-600 bg-red-50 p-2 rounded border border-red-100 inline-block text-sm font-bold">
                    ⚠️ Alerta: {pet.notes}
                </p>
            )}
        </div>
        
        <div className="text-right">
             <div className="bg-slate-800 text-white px-6 py-4 rounded-lg text-center">
                <p className="text-xs uppercase opacity-70">Turnos Totales</p>
                <p className="text-3xl font-bold">{pet.appointments.length}</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: NUEVA NOTA + HISTORIAL TÉCNICO */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Formulario Agregar Nota */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h2 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                    📝 Nueva Nota Técnica
                </h2>
                <form action={createNote}>
                    <input type="hidden" name="petId" value={pet.id} />
                    <textarea 
                        name="content" 
                        required
                        rows={3} 
                        className="w-full p-3 border rounded bg-white focus:ring-2 focus:ring-yellow-400 outline-none"
                        placeholder="Ej: Corte con alza 4, se portó bien, usar shampoo hipoalergénico..."
                    ></textarea>
                    <div className="mt-2 text-right">
                        <button className="bg-yellow-600 text-white px-4 py-2 rounded font-bold hover:bg-yellow-700">
                            Guardar Nota
                        </button>
                    </div>
                </form>
            </div>

            {/* Listado de Notas */}
            <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Historial Técnico</h3>
                {pet.groomingNotes.length === 0 ? (
                    <p className="text-gray-400 italic">No hay notas guardadas.</p>
                ) : (
                    <div className="space-y-4">
                        {pet.groomingNotes.map(note => (
                            <div key={note.id} className="bg-white p-4 rounded shadow-sm border border-l-4 border-l-yellow-400 group">
                                <div className="flex justify-between items-start">
                                    <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                    <form action={deleteNote}>
                                        <input type="hidden" name="id" value={note.id} />
                                        <input type="hidden" name="petId" value={pet.id} />
                                        <button className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition">
                                            Borrar
                                        </button>
                                    </form>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-right">
                                    {note.createdAt.toLocaleDateString()} a las {note.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE TURNOS */}
        <div className="lg:col-span-1">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Historial de Visitas</h3>
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                {pet.appointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Sin visitas aún.</div>
                ) : (
                    <div className="divide-y">
                        {pet.appointments.map(appt => (
                            <div key={appt.id} className="p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-700">
                                        {appt.startTime.toLocaleDateString()}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border 
                                        ${appt.status === 'COMPLETED' || appt.status === 'BILLED' 
                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                            : appt.status === 'CANCELLED' 
                                                ? 'bg-red-50 text-red-500 border-red-100'
                                                : 'bg-blue-50 text-blue-600 border-blue-100'}
                                    `}>
                                        {appt.status === 'BILLED' ? 'COBRADO' : appt.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Hora: {appt.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  )
}