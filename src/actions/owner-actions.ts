// src/actions/owner-actions.ts
"use server"; // Esto le dice a Next.js: "Ejecutame en el servidor, no en el navegador"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOwner(formData: FormData) {
  // 1. Extraer datos del formulario HTML
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  // 2. Validación básica (nunca confíes en el usuario)
  if (!name) return;

  // 3. Guardar en Base de Datos
  await prisma.owner.create({
    data: {
      name,
      email,
      phone,
      isActive: true,
    },
  });

  // 4. Actualizar la pantalla para mostrar el nuevo dato
  revalidatePath("/owners");
}
