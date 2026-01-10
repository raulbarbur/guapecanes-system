// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainNav from "@/components/MainNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
        
        {/* CONTENEDOR PRINCIPAL */}
        {/* Mobile: Columna (Contenido arriba, barra abajo) */}
        {/* Desktop (md): Fila (Barra izquierda, contenido derecha) */}
        <div className="flex flex-col md:flex-row min-h-screen">
          
          {/* 1. La Barra de Navegación (Se adapta sola por dentro) */}
          <MainNav />

          {/* 2. El Área de Contenido */}
          {/* flex-1: Ocupa todo el espacio restante */}
          {/* pb-20: Padding abajo para que en móvil la barra no tape el final de la página */}
          <main className="flex-1 pb-24 md:pb-0 md:px-0">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}