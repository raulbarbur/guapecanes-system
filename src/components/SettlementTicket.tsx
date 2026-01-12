// src/components/SettlementTicket.tsx
'use client'

import { useRef, useState } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import Link from "next/link"

// Tipos de datos necesarios
type SettlementData = {
  id: string
  createdAt: Date
  totalAmount: number
  owner: { name: string; email: string | null }
  items: { 
    id: string
    description: string
    quantity: number
    costAtSale: number // Lo que se le paga al dueño
    createdAt: Date // Fecha de venta original
  }[]
  adjustments: {
    id: string
    description: string
    amount: number
    createdAt: Date
  }[]
}

export default function SettlementTicket({ data }: { data: SettlementData }) {
  const [downloading, setDownloading] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    const element = ticketRef.current
    if (!element) return
    setDownloading(true)

    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      // Ajustamos altura proporcionalmente
      const imgProps = pdf.getImageProperties(imgData)
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Liquidacion_${data.owner.name}_${data.createdAt.toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      console.error(e)
      alert("Error generando PDF")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-gray-100 min-h-screen">
      
      {/* BOTONERA SUPERIOR */}
      <div className="flex gap-4 w-full max-w-2xl">
        <Link href={`/owners`} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm">
            ← Volver
        </Link>
        <button 
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 bg-slate-900 hover:bg-black text-white py-2 rounded font-bold shadow transition"
        >
            {downloading ? "Generando..." : "📥 Descargar PDF"}
        </button>
      </div>

      {/* DOCUMENTO IMPRIMIBLE */}
      <div 
        ref={ticketRef} 
        className="bg-white p-12 shadow-2xl max-w-2xl w-full text-sm text-gray-800"
        style={{ minHeight: '800px' }} // Altura A4 aprox visual
      >
        {/* CABECERA */}
        <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900">GUAPECANES</h1>
                <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Liquidación de Cuenta</p>
            </div>
            <div className="text-right">
                <p className="font-mono text-gray-500 text-xs">REF: {data.id.slice(0,8)}</p>
                <p className="font-bold text-lg">{data.createdAt.toLocaleDateString()}</p>
            </div>
        </div>

        {/* INFO DUEÑO */}
        <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-100">
            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Beneficiario</p>
            <h2 className="text-xl font-bold text-gray-800">{data.owner.name}</h2>
            <p className="text-gray-600">{data.owner.email || "Sin email registrado"}</p>
        </div>

        {/* TABLA DE VENTAS LIQUIDADAS */}
        <div className="mb-8">
            <h3 className="font-bold text-gray-700 border-b pb-2 mb-2 uppercase text-xs">Productos Vendidos</h3>
            <table className="w-full text-left">
                <thead className="text-gray-400 text-xs uppercase">
                    <tr>
                        <th className="py-2">Fecha Venta</th>
                        <th className="py-2">Descripción</th>
                        <th className="py-2 text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                    {data.items.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 text-center text-gray-400 italic">Sin items de venta</td></tr>
                    ) : (
                        data.items.map(item => (
                            <tr key={item.id}>
                                <td className="py-2 text-gray-500">{item.createdAt.toLocaleDateString()}</td>
                                <td className="py-2">
                                    <span className="font-bold mr-1">{item.quantity}x</span>
                                    {item.description}
                                </td>
                                <td className="py-2 text-right">
                                    ${(Number(item.costAtSale) * item.quantity).toLocaleString()}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* TABLA DE AJUSTES */}
        {data.adjustments.length > 0 && (
            <div className="mb-8">
                <h3 className="font-bold text-gray-700 border-b pb-2 mb-2 uppercase text-xs">Otros Movimientos / Ajustes</h3>
                <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-100 font-medium">
                        {data.adjustments.map(adj => (
                            <tr key={adj.id}>
                                <td className="py-2 text-gray-500">{adj.createdAt.toLocaleDateString()}</td>
                                <td className="py-2">{adj.description}</td>
                                <td className={`py-2 text-right font-bold ${Number(adj.amount) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                    ${Number(adj.amount).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* TOTAL FINAL */}
        <div className="flex justify-end mt-10">
            <div className="text-right bg-slate-900 text-white p-6 rounded-lg min-w-[250px]">
                <p className="text-xs uppercase font-bold opacity-70 mb-1">Total Liquidado</p>
                <p className="text-4xl font-black">${Number(data.totalAmount).toLocaleString()}</p>
            </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-xs text-gray-400">
            <p>Comprobante generado electrónicamente por Sistema Guapecanes.</p>
        </div>

      </div>
    </div>
  )
}