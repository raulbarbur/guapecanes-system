import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import MainNav from "@/components/MainNav";
import { Toaster } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const nunito = Nunito({ subsets: ["latin"], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: "Guapecanes",
  description: "Gestión v3.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${nunito.variable} antialiased min-h-screen bg-background text-foreground font-sans`}>
        
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="flex flex-col md:flex-row min-h-screen">
              <MainNav />
              {/* Main Content: Usa bg-background por defecto gracias a globals.css */}
              <main className="flex-1 pb-24 md:pb-0 relative overflow-y-auto h-screen custom-scrollbar bg-background">
                {children}
              </main>
            </div>
            
            <Toaster />
        </ThemeProvider>

      </body>
    </html>
  );
}