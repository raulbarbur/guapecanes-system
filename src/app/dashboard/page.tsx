// src/app/dashboard/page.tsx
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  // 1. DEFINIR EL RANGO DE TIEMPO (ESTE MES)
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // 2. BUSCAR VENTAS DEL MES (COMPLETADAS)
  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED", // Ignoramos las anuladas
      createdAt: {
        gte: firstDayOfMonth, // Mayor o igual al día 1
        lt: nextMonth         // Menor estricto al mes que viene
      }
    },
    include: {
      items: true // Necesitamos los items para ver el COSTO
    }
  })

  // 3. CALCULAR MÉTRICAS
  let totalRevenue = 0 // Lo que entró a caja
  let totalCost = 0    // Lo que le debemos/pagamos a los dueños
  let itemsSold = 0

  sales.forEach(sale => {
    // Sumamos el total de la venta (Ingreso)
    totalRevenue += Number(sale.total)

    // Sumamos los costos de los items individuales
    sale.items.forEach(item => {
      itemsSold += item.quantity
      // Ojo: Si es un servicio (variantId null), el costo es 0 (o mano de obra, pero asumimos 0 por ahora)
      if (item.variantId) {
        totalCost += Number(item.costAtSale) * item.quantity
      }
    })
  })

  const grossProfit = totalRevenue - totalCost
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Tablero de Control</h1>
      <p className="text-gray-500 mb-8">
        Resumen del mes: {firstDayOfMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
      </p>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        
        {/* CARD 1: VENTAS TOTALES */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Ventas Brutas</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            ${totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">{sales.length} transacciones</p>
        </div>

        {/* CARD 2: COSTOS (A DUEÑOS) */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Costos Mercadería</p>
          <p className="text-3xl font-bold text-red-700 mt-2">
            -${totalCost.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">A pagar a dueños</p>
        </div>

        {/* CARD 3: GANANCIA BRUTA */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Ganancia Real</p>
          <p className="text-3xl font-bold text-green-700 mt-2">
            ${grossProfit.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">
             Margen: {margin.toFixed(1)}%
          </p>
        </div>

        {/* CARD 4: VOLUMEN */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500 font-bold uppercase">Productos Vendidos</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {itemsSold}
          </p>
          <p className="text-xs text-gray-400 mt-1">Unidades</p>
        </div>
      </div>

      {/* SUGERENCIA VISUAL: Podríamos poner un gráfico aquí a futuro */}
      <div className="bg-indigo-50 p-10 rounded-lg border border-indigo-100 text-center">
        <h3 className="text-indigo-900 font-bold text-lg mb-2">💡 Interpretación</h3>
        <p className="text-indigo-700 max-w-2xl mx-auto">
          De cada $100 que entran a la caja, te quedan 
          <span className="font-bold text-xl mx-1">${margin.toFixed(0)}</span> 
          para pagar luz, alquiler y tu sueldo. El resto es de los consignantes.
        </p>
      </div>
    </div>
  )
}