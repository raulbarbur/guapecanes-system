// src/app/owners/balance/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function OwnersBalancePage() {
  const ownersData = await prisma.owner.findMany({
    where: { isActive: true },
    include: {
      products: {
        include: {
          variants: {
            include: {
              saleItems: { 
                where: { 
                    sale: { 
                        status: 'COMPLETED',
                        paymentStatus: 'PAID' // 👈 FILTRO
                    } 
                }
              },
            },
          },
        },
      },
      balanceAdjustments: { where: { isApplied: false } }
    },
  });

  const report = ownersData.map((owner) => {
    let debtFromSales = 0;
    let debtFromAdjustments = 0;
    let itemsCount = 0;

    owner.products.forEach((product) => {
      product.variants.forEach((variant) => {
        variant.saleItems.forEach((item) => {
          const remainingQty = item.quantity - item.settledQuantity;
          if (remainingQty > 0) {
            debtFromSales += Number(item.costAtSale) * remainingQty;
            itemsCount += remainingQty;
          }
        });
      });
    });

    owner.balanceAdjustments.forEach(adjustment => {
      debtFromAdjustments += Number(adjustment.amount);
    });

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

  const ownersWithActivity = report
    .filter((r) => r.totalDebt !== 0)
    .sort((a, b) => b.totalDebt - a.totalDebt);

  const ownersClean = report.filter((r) => r.totalDebt === 0);
  const totalGlobal = report.reduce((sum, r) => sum + r.totalDebt, 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER + KPI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">Estado de Cuenta</h1>
            <p className="text-sm text-muted-foreground mt-1">Saldos pendientes a dueños y proveedores.</p>
        </div>
        
        <div className="bg-foreground text-background px-6 py-4 rounded-2xl shadow-xl border border-border">
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Deuda Total Local</p>
            <p className="text-3xl font-black font-nunito tracking-tight">${totalGlobal.toLocaleString()}</p>
        </div>
      </div>

      {/* TABLA DE DEUDAS */}
      <div className="bg-card rounded-3xl shadow-sm overflow-hidden border border-border">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold">
                <tr>
                    <th className="p-5 pl-6">Dueño</th>
                    <th className="p-5 text-center">Items Pend.</th>
                    <th className="p-5 text-right">Saldo Neto</th>
                    <th className="p-5 text-center">Acción</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {ownersWithActivity.map((row) => (
                <tr key={row.ownerId} className="hover:bg-muted/30 transition duration-200">
                    <td className="p-5 pl-6">
                        <p className="font-bold text-lg text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                            {row.phone || "Sin teléfono"}
                        </p>
                        {row.hasAdjustments && (
                            <span className="text-[10px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20 inline-block mt-2 font-bold">
                            ⚠️ Incluye ajustes manuales
                            </span>
                        )}
                    </td>
                    
                    <td className="p-5 text-center">
                        <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-lg text-sm font-bold">
                            {row.itemsCount} u.
                        </span>
                    </td>
                    
                    <td className="p-5 text-right">
                        <span className={cn(
                            "text-xl font-black font-mono",
                            row.totalDebt >= 0 
                                ? 'text-destructive dark:text-red-400' 
                                : 'text-green-600 dark:text-green-400'
                        )}>
                            ${row.totalDebt.toLocaleString()}
                        </span>
                        {row.totalDebt < 0 && (
                            <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase mt-1">Saldo a favor Local</p>
                        )}
                    </td>
                    
                    <td className="p-5 text-center">
                        <Link
                            href={`/owners/settlement/${row.ownerId}`}
                            className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl text-sm font-bold border border-primary/10 transition shadow-sm"
                        >
                            Ver Detalle
                        </Link>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {ownersWithActivity.length === 0 && (
          <div className="p-12 text-center text-muted-foreground bg-muted/20">
            <span className="text-4xl block mb-2 opacity-50">🎉</span>
            ¡Todo al día! No hay saldos pendientes.
          </div>
        )}
      </div>

      {/* DUEÑOS AL DÍA */}
      {ownersClean.length > 0 && (
        <div className="bg-card/50 p-6 rounded-3xl border border-border border-dashed">
            <details className="group">
                <summary className="cursor-pointer text-muted-foreground font-bold hover:text-foreground select-none flex items-center gap-2">
                    <span>Ver dueños sin saldo pendiente ({ownersClean.length})</span>
                    <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {ownersClean.map((o) => (
                    <div
                        key={o.ownerId}
                        className="p-3 rounded-xl bg-background border border-border text-sm flex justify-between items-center opacity-70 hover:opacity-100 transition"
                    >
                        <span className="font-medium">{o.name}</span>
                        <span className="text-green-500 font-bold">✓</span>
                    </div>
                    ))}
                </div>
            </details>
        </div>
      )}
    </div>
  );
}