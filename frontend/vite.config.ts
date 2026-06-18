import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwind()
  ],
  envDir: '../',
  build: {
    outDir: 'dist',
    // Pastikan semua asset pakai path relatif — penting untuk HuggingFace Spaces
    assetsDir: 'assets',
  },
});
