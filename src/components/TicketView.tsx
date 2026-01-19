'use client'

import { useState, useRef } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { cn } from "@/lib/utils"

type TicketProps = {
  saleId: string
  date: Date
  items: { description: string; quantity: number; price: number }[]
  total: number
  paymentMethod: string
  onClose: () => void
  mode?: 'POS' | 'HISTORY'
}

export default function TicketView({ saleId, date, items, total, paymentMethod, onClose, mode = 'POS' }: TicketProps) {
  const [downloading, setDownloading] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    const element = ticketRef.current
    if (!element) return

    setDownloading(true)

    try {
      // 1. Captura del Canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Mayor calidad
        backgroundColor: "#ffffff", // Fondo blanco forzado
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL('image/png')
      
      // 2. Generación PDF (A4)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      // Ajuste de márgenes para centrar o expandir
      const margin = 20 
      const finalWidth = pdfWidth - (margin * 2)
      const finalHeight = (imgHeight * finalWidth) / imgWidth

      pdf.addImage(imgData, 'PNG', margin, 20, finalWidth, finalHeight)
      pdf.save(`Ticket_${saleId.slice(0, 8)}.pdf`)

    } catch (error) {
      console.error("Error al generar PDF:", error)
      alert("Hubo un error al generar el comprobante. Intenta nuevamente.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] h-full p-4 animate-in zoom-in-95 duration-300 w-full">
        
        {/* 
            === TICKET VISUAL & PRINT SOURCE === 
            Usamos colores 'Slate' fijos (900, 500, 200) en lugar de variables semánticas.
            Esto garantiza que se vea igual en Dark y Light mode.
            bg-white text-slate-900 siempre es negro sobre blanco.
        */}
        <div 
            ref={ticketRef} 
            className="p-8 md:p-10 bg-white text-slate-900 w-full max-w-[400px] shadow-2xl relative overflow-hidden flex flex-col gap-6"
            // Estilos inline de respaldo para html2canvas si falla tailwind
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }} 
        >
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-3xl font-black tracking-tighter font-nunito text-slate-900">
                    GUAPECANES
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">
                    {mode === 'POS' ? 'Comprobante Oficial' : 'Copia de Archivo'}
                </p>
            </div>

            {/* Metadatos */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600">
                <div>
                    <p className="font-bold text-[10px] uppercase text-slate-400">Fecha</p>
                    <p className="font-mono font-bold text-slate-900">{new Date(date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-[10px] uppercase text-slate-400">Hora</p>
                    <p className="font-mono font-bold text-slate-900">{new Date(date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
                <div>
                    <p className="font-bold text-[10px] uppercase text-slate-400">ID Operación</p>
                    <p className="font-mono text-xs text-slate-900">#{saleId.slice(0,8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-[10px] uppercase text-slate-400">Método</p>
                    <p className="font-bold text-slate-900 uppercase">{paymentMethod === 'CASH' ? 'Efectivo' : paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Cta. Corriente'}</p>
                </div>
            </div>

            {/* Tabla de Items */}
            <div className="border-t border-slate-200 pt-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                            <th className="text-left py-1 font-bold">Cant. / Detalle</th>
                            <th className="text-right py-1 font-bold">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="font-medium text-slate-800">
                        {items.map((item, i) => (
                            <tr key={i} className="border-b border-slate-50">
                                <td className="py-2 pr-2 align-top">
                                    <span className="font-bold text-slate-900 mr-1">{item.quantity}</span>
                                    <span className="text-xs text-slate-600">x</span>
                                    <span className="ml-2">{item.description}</span>
                                </td>
                                <td className="py-2 text-right align-top font-mono font-bold">
                                    ${(item.price * item.quantity).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totales */}
            <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100 mt-2">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Total</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                    ${total.toLocaleString()}
                </span>
            </div>
            
            {/* Footer Legal */}
            <div className="text-center space-y-1 mt-2">
               <p className="text-[10px] text-slate-400 font-medium">Gracias por confiar en nosotros 🐶</p>
               <p className="text-[8px] text-slate-300 uppercase">Documento no válido como factura fiscal</p>
            </div>

            {/* Decoración CSS (Solo visual, borde dentado abajo) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] bg-[length:10px_10px] opacity-30"></div>
        </div>

        {/* BOTONERA (Fuera del área de impresión) */}
        <div className="mt-8 flex flex-col gap-3 w-full max-w-[400px]">
            <button 
                onClick={handleDownloadPDF}
                disabled={downloading}
                className={cn(
                    "w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 text-white",
                    downloading 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-red-600 to-red-500 hover:to-red-600 hover:shadow-red-500/30'
                )}
            >
                {downloading ? (
                    <>
                        <span className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"/>
                        <span>Procesando PDF...</span>
                    </>
                ) : (
                    <>
                        <span>📥</span> 
                        <span>Descargar PDF</span>
                    </>
                )}
            </button>

            <button 
                onClick={onClose}
                disabled={downloading}
                className="w-full bg-card hover:bg-accent text-foreground border border-border font-bold py-4 rounded-xl shadow-sm transition active:scale-95 text-sm"
            >
                {mode === 'POS' ? '✨ Nueva Venta' : 'Cerrar'}
            </button>
        </div>
    </div>
  )
}