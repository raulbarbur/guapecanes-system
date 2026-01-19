// src/app/pets/[id]/page.tsx
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { createNote, deleteNote } from "@/actions/note-actions"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PetDetailPage({ params }: Props) {
  const { id } = await params

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { startTime: 'desc' }
      },
      groomingNotes: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!pet) return <div className="p-10 text-foreground">Mascota no encontrada</div>

  // Wrapper action para satisfacer el tipado del formulario
  async function createNoteAction(formData: FormData) {
    // No se necesita `use server` aquí porque la acción importada ya lo tiene
    await createNote(formData)
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* CABECERA DE PERFIL */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div>
            <Link href="/pets" className="text-xs font-bold text-primary hover:underline mb-2 block">← Volver al listado</Link>
            <h1 className="text-4xl font-black text-foreground flex items-center gap-3 font-nunito">
                {pet.name}
                <span className="text-lg font-bold bg-secondary text-secondary-foreground px-3 py-1 rounded-xl border border-border">
                    {pet.breed || "Mestizo"}
                </span>
            </h1>
            <div className="mt-2 text-muted-foreground flex flex-col gap-1 text-sm font-medium">
                <p>👤 Dueño: <strong className="text-foreground">{pet.ownerName}</strong></p>
                <p>📞 Tel: <strong className="text-foreground">{pet.ownerPhone}</strong></p>
            </div>
            {pet.notes && (
                <p className="mt-4 text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 inline-block text-xs font-bold">
                    ⚠️ Alerta: {pet.notes}
                </p>
            )}
        </div>
        
        <div className="bg-card text-card-foreground p-6 rounded-3xl border border-border shadow-sm min-w-[200px] text-center">
            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Visitas Totales</p>
            <p className="text-4xl font-black font-nunito">{pet.appointments.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: NUEVA NOTA + HISTORIAL TÉCNICO */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Formulario Agregar Nota */}
            <div className="bg-yellow-500/5 p-6 rounded-3xl border border-yellow-500/20">
                <h2 className="font-bold text-yellow-700 dark:text-yellow-400 mb-4 flex items-center gap-2">
                    📝 Nueva Nota Técnica
                </h2>
                {/* 👇 CAMBIO REALIZADO AQUÍ 👇 */}
                <form action={createNoteAction}>
                    <input type="hidden" name="petId" value={pet.id} />
                    <textarea 
                        name="content" 
                        required
                        rows={3} 
                        className="w-full p-4 border border-yellow-500/20 rounded-xl bg-background text-foreground focus:ring-2 focus:ring-yellow-500 outline-none placeholder:text-muted-foreground"
                        placeholder="Ej: Corte con alza 4, se portó bien..."
                    ></textarea>
                    <div className="mt-3 text-right">
                        <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-sm text-sm">
                            Guardar Nota
                        </button>
                    </div>
                </form>
            </div>

            {/* Listado de Notas */}
            <div>
                <h3 className="text-xl font-black mb-4 text-foreground font-nunito">Historial Técnico</h3>
                {pet.groomingNotes.length === 0 ? (
                    <p className="text-muted-foreground italic text-sm">No hay notas guardadas.</p>
                ) : (
                    <div className="space-y-4">
                        {pet.groomingNotes.map(note => (
                            <div key={note.id} className="bg-card p-5 rounded-2xl shadow-sm border border-border group relative">
                                <div className="flex justify-between items-start">
                                    <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground font-bold">
                                        {note.createdAt.toLocaleDateString()}
                                    </p>
                                    <form action={deleteNote}>
                                        <input type="hidden" name="id" value={note.id} />
                                        <input type="hidden" name="petId" value={pet.id} />
                                        <button className="text-destructive hover:underline text-[10px] font-bold opacity-0 group-hover:opacity-100 transition">
                                            BORRAR
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE TURNOS */}
        <div className="lg:col-span-1">
            <h3 className="text-xl font-black mb-4 text-foreground font-nunito">Historial de Visitas</h3>
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                {pet.appointments.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">Sin visitas aún.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {pet.appointments.map(appt => (
                            <div key={appt.id} className="p-4 hover:bg-muted/30 transition">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-foreground text-sm">
                                        {appt.startTime.toLocaleDateString()}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] px-2 py-0.5 rounded font-black border uppercase",
                                        appt.status === 'COMPLETED' || appt.status === 'BILLED' 
                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                                            : appt.status === 'CANCELLED' 
                                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                    )}>
                                        {appt.status === 'BILLED' ? 'COBRADO' : appt.status}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono">
                                    {appt.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
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