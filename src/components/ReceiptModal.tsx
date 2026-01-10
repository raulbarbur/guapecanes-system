// src/components/ReceiptModal.tsx
'use client'

import { useState } from "react"
import TicketView from "./TicketView"

type SaleData = {
  id: string
  total: number
  paymentMethod: string
  createdAt: Date
  items: { description: string; quantity: number; priceAtSale: number }[]
}

export default function ReceiptModal({ sale }: { sale: SaleData }) {
  const [isOpen, setIsOpen] = useState(false)

  // Mapeamos los datos de DB a lo que espera el Ticket
  const ticketItems = sale.items.map(i => ({
    description: i.description,
    quantity: i.quantity,
    price: i.priceAtSale // El ticket espera 'price', la DB tiene 'priceAtSale'
  }))

  return (
    <>
      {/* EL BOTÓN ACTIVADOR */}
      <button 
        onClick={(e) => {
            e.stopPropagation() // Evita que se cierre/abra el acordeón de la fila
            setIsOpen(true)
        }}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded border border-gray-300 flex items-center gap-1 transition"
      >
        📄 Ver Ticket
      </button>

      {/* EL MODAL (Solo visible si isOpen === true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            
            {/* Contenedor del Ticket (Con scroll si es muy alto) */}
            <div className="bg-transparent w-full max-w-lg max-h-screen overflow-y-auto">
                <TicketView 
                    mode="HISTORY"
                    saleId={sale.id}
                    date={sale.createdAt}
                    items={ticketItems}
                    total={sale.total}
                    paymentMethod={sale.paymentMethod}
                    onClose={() => setIsOpen(false)} // Cierra el modal
                />
            </div>

        </div>
      )}
    </>
  )
}