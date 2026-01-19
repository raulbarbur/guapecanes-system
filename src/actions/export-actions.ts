// src/actions/export-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"
import { getSession } from "@/lib/auth"

export async function exportProducts(mode: 'TEMPLATE' | 'FULL') {
  // R-01: Blindaje de seguridad RBAC
  const session = await getSession()
  // Validamos existencia de sesión Y rol de administrador
  if (!session || session.role !== 'ADMIN') {
    return { success: false, error: "Requiere permisos de Administrador." }
  }

  try {
    // 1. Crear Libro y Hoja
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Productos")

    // 2. Definir Columnas (Mismo orden que el Importador)
    worksheet.columns = [
      { header: "Nombre Producto", key: "name", width: 30 },
      { header: "Variante", key: "variant", width: 20 },
      { header: "Categoría", key: "category", width: 20 },
      { header: "Nombre Dueño", key: "owner", width: 20 },
      { header: "Costo", key: "cost", width: 15 },
      { header: "Precio Venta", key: "price", width: 15 },
    ]

    // Estilar la cabecera (Negrita y fondo gris)
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }
    }

    // 3. Si es FULL, llenamos con datos
    if (mode === 'FULL') {
      // R-02: Límite de seguridad para prevenir OOM (Out of Memory)
      const SAFE_LIMIT = 2000 
      
      const products = await prisma.product.findMany({
        where: { isActive: true }, // Solo activos
        include: {
          category: true,
          owner: true,
          variants: true
        },
        orderBy: { name: 'asc' },
        take: SAFE_LIMIT // 👈 Límite preventivo
      })

      // APLANAMOS LA DATA (Flatten)
      for (const p of products) {
        for (const v of p.variants) {
          worksheet.addRow({
            name: p.name,
            variant: v.name === "Estándar" ? "" : v.name, // Dejamos vacío si es estándar para limpieza visual
            category: p.category.name,
            owner: p.owner.name,
            cost: Number(v.costPrice),
            price: Number(v.salePrice)
          })
        }
      }
    }

    // 4. Generar Buffer y convertir a Base64
    const buffer = await workbook.xlsx.writeBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    
    const filename = mode === 'FULL' 
        ? `Inventario_Guapecanes_${new Date().toISOString().split('T')[0]}.xlsx`
        : `Plantilla_Carga_Productos.xlsx`

    return { success: true, base64, filename }

  } catch (error) {
    console.error("Error exportando:", error)
    return { success: false, error: "Error al generar el archivo Excel (Posible exceso de datos)." }
  }
}