// src/actions/inventory-export-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"

export async function exportInventorySheet() {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Carga de Stock")

    // Columnas
    worksheet.columns = [
      { header: "ID_VARIANTE (NO TOCAR)", key: "id", width: 32 }, // Columna técnica
      { header: "Producto", key: "productName", width: 25 },
      { header: "Variante", key: "variantName", width: 15 },
      { header: "Dueño", key: "ownerName", width: 20 },
      { header: "Stock Actual", key: "currentStock", width: 12 },
      { header: "CANTIDAD A SUMAR", key: "quantity", width: 20 }, // Aquí escribe el usuario
      { header: "MOTIVO (Opcional)", key: "reason", width: 25 },
    ]

    // Estilo Cabecera
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

    // Obtenemos datos
    const variants = await prisma.productVariant.findMany({
      where: { product: { isActive: true } },
      include: { product: { include: { owner: true } } },
      orderBy: { product: { name: 'asc' } }
    })

    // Llenamos filas
    for (const v of variants) {
      worksheet.addRow({
        id: v.id,
        productName: v.product.name,
        variantName: v.name === 'Estándar' ? '-' : v.name,
        ownerName: v.product.owner.name,
        currentStock: v.stock,
        quantity: "", // Vacío para que el usuario complete
        reason: "Ingreso Masivo"
      })
    }

    // Protegemos las columnas informativas para evitar errores (opcional, pero buena práctica)
    // worksheet.getColumn('A').hidden = true; // Podríamos ocultar el ID, pero mejor dejarlo visible por transparencia

    const buffer = await workbook.xlsx.writeBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    
    return { 
        success: true, 
        base64, 
        filename: `Planilla_Stock_${new Date().toISOString().split('T')[0]}.xlsx` 
    }

  } catch (error) {
    console.error("Error exportando stock:", error)
    return { success: false, error: "Error generando planilla." }
  }
}