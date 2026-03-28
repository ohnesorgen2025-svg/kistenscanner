import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server:
    command === "serve"
      ? {
          port: 5174,
          proxy: {
            "/api": "http://127.0.0.1:4001",
            "/images": "http://127.0.0.1:4001",
          },
        }
      : undefined,
}));
