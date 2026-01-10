// src/components/TicketView.tsx
'use client'

import { useState, useRef } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

type TicketProps = {
  saleId: string
  date: Date
  items: { description: string; quantity: number; price: number }[]
  total: number
  paymentMethod: string
  onClose: () => void // 👈 Renombramos onNewSale a onClose para que sea genérico
  mode?: 'POS' | 'HISTORY' // 👈 Nuevo: Para saber qué texto mostrar
}

export default function TicketView({ saleId, date, items, total, paymentMethod, onClose, mode = 'POS' }: TicketProps) {
  const [downloading, setDownloading] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    const element = ticketRef.current
    if (!element) return

    setDownloading(true)

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        onclone: (documentClone) => {
            const el = documentClone.getElementById('printable-ticket')
            if (el) {
                el.style.backgroundColor = "#ffffff"
                el.style.color = "#000000"
            }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      const margin = 20
      const finalWidth = pdfWidth - (margin * 2)
      const finalHeight = (imgHeight * finalWidth) / imgWidth

      pdf.addImage(imgData, 'PNG', margin, 20, finalWidth, finalHeight)
      pdf.save(`Ticket_${saleId.slice(0, 8)}.pdf`)

    } catch (error: any) {
      console.error("Error PDF:", error)
      alert("Error al crear PDF.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-in zoom-in-95 duration-300 w-full">
        
        {/* TICKET VISUAL */}
        <div 
            id="printable-ticket"
            ref={ticketRef} 
            className="p-10 rounded-none shadow-xl border w-full max-w-md relative overflow-hidden bg-white text-black"
            style={{ backgroundColor: "#ffffff", color: "#000000" }}
        >
            <div className="text-center mb-8 border-b-2 pb-4" style={{ borderColor: "#1e293b" }}>
                <h2 className="text-3xl font-black tracking-tighter" style={{ color: "#1e293b" }}>GUAPECANES</h2>
                <p className="text-xs uppercase tracking-[0.3em] mt-1" style={{ color: "#64748b" }}>
                    {mode === 'POS' ? 'Comprobante de Venta' : 'Copia de Comprobante'}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6" style={{ color: "#475569" }}>
                <div>
                    <p className="font-bold text-xs uppercase" style={{ color: "#94a3b8" }}>Fecha</p>
                    <p>{new Date(date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-xs uppercase" style={{ color: "#94a3b8" }}>Hora</p>
                    <p>{new Date(date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
                <div>
                    <p className="font-bold text-xs uppercase" style={{ color: "#94a3b8" }}>ID Operación</p>
                    <p className="font-mono text-xs">{saleId.slice(0,8)}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-xs uppercase" style={{ color: "#94a3b8" }}>Pago</p>
                    <p>{paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}</p>
                </div>
            </div>

            <table className="w-full text-sm mb-6">
                <thead>
                    <tr className="border-b-2 text-xs uppercase" style={{ borderColor: "#f1f5f9", color: "#94a3b8" }}>
                        <th className="text-left py-2">Item</th>
                        <th className="text-right py-2">Total</th>
                    </tr>
                </thead>
                <tbody className="font-medium">
                    {items.map((item, i) => (
                        <tr key={i} className="border-b" style={{ borderColor: "#f8fafc" }}>
                            <td className="py-2">
                                <span className="font-bold mr-2">{item.quantity}x</span>
                                {item.description}
                            </td>
                            <td className="py-2 text-right">${(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="p-4 rounded-lg flex justify-between items-center" style={{ backgroundColor: "#f8fafc" }}>
                <span className="text-sm font-bold uppercase" style={{ color: "#64748b" }}>Total a Pagar</span>
                <span className="text-3xl font-black" style={{ color: "#0f172a" }}>${total.toLocaleString()}</span>
            </div>
            
            <div className="mt-8 text-center text-[10px]" style={{ color: "#94a3b8" }}>
               <p>Documento generado electrónicamente.</p>
            </div>
        </div>

        {/* BOTONERA */}
        <div className="mt-8 flex flex-col gap-3 w-full max-w-sm">
            <button 
                onClick={handleDownloadPDF}
                disabled={downloading}
                className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition text-white
                    ${downloading ? 'bg-slate-400 cursor-wait' : 'bg-red-600 hover:bg-red-700'}
                `}
            >
                {downloading ? "Generando PDF..." : "📥 Descargar Comprobante"}
            </button>

            <button 
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-lg mt-2 shadow transition"
            >
                {mode === 'POS' ? '✨ Nueva Venta' : 'Cerrar Vista'}
            </button>
        </div>
    </div>
  )
}