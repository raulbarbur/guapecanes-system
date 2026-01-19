export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] w-full gap-4 animate-in fade-in duration-300">
      
      {/* Contenedor Visual */}
      <div className="relative">
        {/* Spinner de fondo (Aro) */}
        <div className="w-16 h-16 rounded-full border-4 border-muted opacity-30"></div>
        
        {/* Spinner activo (Giro) */}
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin shadow-lg shadow-primary/20"></div>
        
        {/* Icono Central (Opcional - Marca) */}
        <div className="absolute inset-0 flex items-center justify-center text-xl animate-pulse">
          🐶
        </div>
      </div>

      {/* Texto de estado */}
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-foreground font-black font-nunito text-lg tracking-tight">
          Cargando
        </h3>
        <p className="text-xs text-muted-foreground font-medium animate-pulse">
          Preparando entorno...
        </p>
      </div>
    </div>
  )
}