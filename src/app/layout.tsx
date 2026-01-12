// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 👈 Cambiamos Geist por Inter
import "./globals.css";
import MainNav from "@/components/MainNav";

// Configuramos la fuente Inter
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Guapecanes - Sistema de Gestión",
  description: "Gestión de Peluquería y Consignación",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* Aplicamos la clase de la fuente Inter */}
      <body className={`${inter.className} antialiased bg-gray-50 min-h-screen`}>
        
        {/* CONTENEDOR PRINCIPAL */}
        <div className="flex flex-col md:flex-row min-h-screen">
          
          {/* 1. Barra de Navegación */}
          <MainNav />

          {/* 2. Área de Contenido */}
          <main className="flex-1 pb-24 md:pb-0 md:px-0">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}