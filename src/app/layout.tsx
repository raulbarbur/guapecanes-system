// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainNav from "@/components/MainNav"; // 👈 Importamos la barra

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        {/* 1. Barra de Navegación Fija Arriba */}
        <MainNav />

        {/* 2. Contenido de la página (con un poco de margen para respirar) */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}