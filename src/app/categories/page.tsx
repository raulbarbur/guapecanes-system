// src/app/categories/page.tsx

import { createCategory } from '@/actions/category-actions';
import { prisma } from '@/lib/prisma'; // << 1. IMPORTAR PRISMA
import { AppCard } from '@/components/ui/shared/AppCard';
import { PageHeader } from '@/components/ui/shared/PageHeader';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { revalidatePath } from 'next/cache';

export default async function CategoriesPage() {
  // << 2. LEER DATOS DIRECTAMENTE DESDE LA BASE DE DATOS >>
  // Esto reemplaza la llamada a getCategories() que no existía.
  // Prisma nos da el tipado correcto automáticamente, solucionando el error 'any'.
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  // La función "wrapper" para el formulario sigue siendo necesaria para el tipado del 'action'.
  async function handleCreateCategory(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;
    if (!name || name.trim().length === 0) {
      return;
    }

    await createCategory(formData);
    revalidatePath('/categories');
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Gestión de Categorías"
        description="Añade o modifica las categorías de tus productos."
      />

      {/* FORMULARIO */}
      <AppCard>
        <form action={handleCreateCategory} className="flex flex-col md:flex-row gap-4">
          <input
            name="name"
            type="text"
            placeholder="Nombre de la nueva categoría..."
            required
            className="w-full border border-input bg-background p-2 rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none transition"
          />
          <SubmitButton loadingText="Creando..." className="w-full md:w-auto">
            Crear Categoría
          </SubmitButton>
        </form>
      </AppCard>

      {/* LISTADO DE CATEGORÍAS */}
      <AppCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold border-b border-border">
              <tr>
                <th className="p-4 pl-6">Nombre</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-12 text-center text-muted-foreground">
                    No hay categorías creadas.
                  </td>
                </tr>
              ) : (
                // El error de 'any' se soluciona aquí porque 'categories' ahora tiene un tipo claro.
                categories.map((category) => (
                  <tr key={category.id}>
                    <td className="p-4 pl-6 font-medium">{category.name}</td>
                    <td className="p-4 text-right">
                      {/* Aquí irían los botones de Editar/Eliminar */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  );
}