import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5174,
    proxy: {
      "/api": "http://127.0.0.1:4001",
      "/images": "http://127.0.0.1:4001",
    },
  },
  plugins: [react()],
});
