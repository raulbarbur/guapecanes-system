// src/context/PosContext.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePos, ProductGroupType, CustomerOption } from '@/hooks/usePos'

// Inferimos el tipo exacto del retorno de usePos
type PosContextType = ReturnType<typeof usePos>

const PosContext = createContext<PosContextType | undefined>(undefined)

interface PosProviderProps {
  children: ReactNode
  products: ProductGroupType[]
  customers: CustomerOption[]
}

export function PosProvider({ children, products, customers }: PosProviderProps) {
  // Aquí se inicializa el "Cerebro" una única vez
  const posState = usePos(products, customers)

  return (
    <PosContext.Provider value={posState}>
      {children}
    </PosContext.Provider>
  )
}

export function usePosContext() {
  const context = useContext(PosContext)
  if (context === undefined) {
    throw new Error('usePosContext debe ser usado dentro de un PosProvider')
  }
  return context
}