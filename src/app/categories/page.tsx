// src/app/categories/page.tsx
import { createCategory } from "@/actions/category-actions"
import { prisma } from "@/lib/prisma"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' } // Orden alfabético
  })

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Categorías de Productos</h1>

      {/* FORMULARIO */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-10 border">
        <form action={createCategory} className="flex gap-4">
          <input 
            name="name" 
            type="text" 
            required 
            className="border p-2 rounded flex-1" 
            placeholder="Ej: Alimentos, Accesorios..."
          />
          <button 
            type="submit" 
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
          >
            Agregar
          </button>
        </form>
      </div>

      {/* LISTADO */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="border p-4 rounded bg-gray-50 flex justify-between items-center">
            <span className="font-semibold">{cat.name}</span>
            <span className="text-xs text-gray-400">ID: {cat.id.slice(0, 8)}...</span>
          </div>
        ))}
      </div>
    </div>
  )
}