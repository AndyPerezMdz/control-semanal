import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Evita que Next.js adivine mal la raíz del proyecto cuando hay otro
  // package-lock.json en una carpeta de arriba (p. ej. C:\Users\carlos\).
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
