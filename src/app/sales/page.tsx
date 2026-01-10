// src/app/sales/page.tsx
import { prisma } from "@/lib/prisma"
import CancelSaleButton from "@/components/CancelSaleButton" // 👈 Importamos el nuevo componente

export default async function SalesHistoryPage() {
  // Buscamos las ventas
  const sales = await prisma.sale.findMany({
    include: {
      items: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Historial de Ventas</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
            <tr>
              <th className="p-4">Fecha / ID</th>
              <th className="p-4">Items</th>
              <th className="p-4">Total</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map((sale) => (
              <tr key={sale.id} className={sale.status === 'CANCELLED' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                <td className="p-4">
                  <p className="font-bold">{sale.createdAt.toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500 font-mono">{sale.id.slice(0, 8)}...</p>
                </td>
                
                <td className="p-4">
                  <ul className="text-sm list-disc pl-4">
                    {sale.items.map(item => (
                      <li key={item.id}>
                        {item.quantity} x {item.description}
                      </li>
                    ))}
                  </ul>
                </td>

                <td className="p-4 font-bold text-lg">
                  ${sale.total.toString()}
                </td>

                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold
                    ${sale.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-800'}
                  `}>
                    {sale.status === 'COMPLETED' ? 'COBRADO' : 'ANULADO'}
                  </span>
                </td>

                <td className="p-4">
                  {sale.status === 'COMPLETED' && (
                    /* 👇 Usamos el componente interactivo aquí */
                    <CancelSaleButton saleId={sale.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sales.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No hay ventas registradas aún.
          </div>
        )}
      </div>
    </div>
  )
}