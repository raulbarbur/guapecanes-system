// src/app/owners/balance/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function OwnersBalancePage() {
  // 1. LA CONSULTA MAESTRA ACTUALIZADA
  // Buscamos dueños, sus ventas pendientes Y sus ajustes pendientes
  const ownersData = await prisma.owner.findMany({
    where: { isActive: true },
    include: {
      // A. Ventas pendientes (Deuda del Local -> Dueño)
      products: {
        include: {
          variants: {
            include: {
              saleItems: {
                where: { isSettled: false },
              },
            },
          },
        },
      },
      // B. Ajustes pendientes (Deuda del Dueño -> Local, usualmente negativo)
      balanceAdjustments: {
        where: { isApplied: false }
      }
    },
  });

  // 2. PROCESAMIENTO DE DATOS
  const report = ownersData.map((owner) => {
    let debtFromSales = 0;
    let debtFromAdjustments = 0;
    let itemsCount = 0;

    // A. Sumar deuda por ventas (Mercadería vendida y no pagada)
    owner.products.forEach((product) => {
      product.variants.forEach((variant) => {
        variant.saleItems.forEach((item) => {
          debtFromSales += Number(item.costAtSale) * item.quantity;
          itemsCount += item.quantity;
        });
      });
    });

    // B. Sumar deuda por ajustes (Devoluciones de ventas ya pagadas)
    owner.balanceAdjustments.forEach(adjustment => {
      debtFromAdjustments += Number(adjustment.amount);
    });

    // C. Deuda Neta Total (Suma algebraica)
    // Ejemplo: Ventas ($1000) + Devolución (-$200) = Total a Pagar ($800)
    const totalDebt = debtFromSales + debtFromAdjustments;

    return {
      ownerId: owner.id,
      name: owner.name,
      phone: owner.phone,
      totalDebt,
      itemsCount,
      hasAdjustments: owner.balanceAdjustments.length > 0
    };
  });

  // Filtramos: Mostramos si hay deuda O si hay saldo a favor del local (deuda negativa)
  const ownersWithActivity = report
    .filter((r) => r.totalDebt !== 0)
    .sort((a, b) => b.totalDebt - a.totalDebt);

  const ownersClean = report.filter((r) => r.totalDebt === 0);

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Estado de Cuenta
        </h1>
        <div className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold shadow-lg">
          Total a Pagar: $
          {report.reduce((sum, r) => sum + r.totalDebt, 0).toLocaleString()}
        </div>
      </div>

      {/* TABLA DE DEUDAS */}
      <div className="bg-white rounded-lg shadow overflow-hidden border mb-10">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold border-b">
            <tr>
              <th className="p-4">Dueño</th>
              <th className="p-4 text-center">Items Pend.</th>
              <th className="p-4 text-right">Saldo Neto</th>
              <th className="p-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ownersWithActivity.map((row) => (
              <tr key={row.ownerId} className="hover:bg-blue-50 transition">
                <td className="p-4">
                  <p className="font-bold text-lg text-gray-800">{row.name}</p>
                  <p className="text-xs text-gray-500">
                    {row.phone || "Sin teléfono"}
                  </p>
                  {row.hasAdjustments && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200 inline-block mt-1">
                      ⚠️ Incluye ajustes/devoluciones
                    </span>
                  )}
                </td>
                
                <td className="p-4 text-center font-mono text-lg text-gray-600">
                  {row.itemsCount}
                </td>
                
                <td className="p-4 text-right">
                  <span className={`text-xl font-bold ${row.totalDebt >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${row.totalDebt.toLocaleString()}
                  </span>
                  {row.totalDebt < 0 && (
                     <p className="text-xs text-green-600 font-bold">Saldo a favor Local</p>
                  )}
                </td>
                
                <td className="p-4 text-center">
                  <Link
                    href={`/owners/settlement/${row.ownerId}`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 shadow inline-block font-medium"
                  >
                    Ver Detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {ownersWithActivity.length === 0 && (
          <div className="p-10 text-center text-gray-500 text-lg">
            ✅ ¡Todo al día! No hay saldos pendientes.
          </div>
        )}
      </div>

      {/* DUEÑOS AL DÍA */}
      {ownersClean.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-gray-500 font-medium hover:text-gray-700 select-none">
            Ver dueños sin saldo pendiente ({ownersClean.length})
          </summary>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 opacity-75">
            {ownersClean.map((o) => (
              <div
                key={o.ownerId}
                className="border p-3 rounded bg-gray-50 text-sm flex justify-between"
              >
                <span>{o.name}</span>
                <span className="text-green-600 font-bold">✓</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}