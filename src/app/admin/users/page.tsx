import { prisma } from "@/lib/prisma"
import UserForm from "@/components/UserForm"
import { deleteUser } from "@/actions/user-actions"
import { PageHeader } from "@/components/ui/shared/PageHeader"
import { AppCard } from "@/components/ui/shared/AppCard"
import { cn } from "@/lib/utils"

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      <PageHeader 
        title="Gestión de Equipo"
        description="Control de acceso y roles del personal."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: ALTA */}
        <div className="lg:col-span-1">
             <UserForm />
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="lg:col-span-2">
            <AppCard noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold border-b border-border">
                            <tr>
                                <th className="p-4 pl-6">Usuario</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4 text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-muted-foreground">
                                        <span className="text-4xl block mb-2 opacity-50">🛡️</span>
                                        No hay usuarios registrados aún.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider",
                                                user.role === 'ADMIN' 
                                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' 
                                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                            )}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            {/* 
                                                FIX TS: Envolvemos la llamada en una función asíncrona anónima.
                                                Esto satisface el tipo 'void | Promise<void>' que espera 'action'.
                                            */}
                                            <form action={async (formData) => {
                                                'use server'
                                                await deleteUser(formData)
                                            }}>
                                                <input type="hidden" name="id" value={user.id} />
                                                <button 
                                                    className="text-muted-foreground hover:text-destructive font-bold text-xs transition-colors flex items-center gap-1 ml-auto"
                                                    title="Revocar acceso"
                                                >
                                                    <span>🗑️</span> ELIMINAR
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </AppCard>
        </div>

      </div>
    </div>
  )
}