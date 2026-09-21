import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control Semanal de Actividades",
  description: "Registro y control de actividades del equipo de ingeniería",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
