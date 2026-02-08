import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { resolve } from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "chrome 86"],
    }),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  build: {
    target: "es2015",
    sourcemap: true,
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./frontend"),
      "@components": resolve(__dirname, "./frontend/components"),
      "@utils": resolve(__dirname, "./frontend/utils"),
      "@types": resolve(__dirname, "./frontend/types"),
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));
