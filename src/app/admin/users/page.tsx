// src/app/admin/users/page.tsx
import { prisma } from "@/lib/prisma"
import UserForm from "@/components/UserForm"
import { deleteUser } from "@/actions/user-actions"

export default async function UsersPage() {
  // Obtenemos usuarios (Server Side)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Equipo</h1>
        <p className="text-gray-500">Administra quién tiene acceso al sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: ALTA */}
        <div className="md:col-span-1">
            <UserForm />
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400">
                                    No hay usuarios registrados aún.
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border
                                            ${user.role === 'ADMIN' 
                                                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                                : 'bg-blue-100 text-blue-700 border-blue-200'}
                                        `}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <form action={deleteUser}>
                                            <input type="hidden" name="id" value={user.id} />
                                            <button 
                                                className="text-red-400 hover:text-red-600 font-bold text-xs hover:underline"
                                                title="Eliminar usuario permanentemente"
                                            >
                                                ELIMINAR
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  )
}