import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/app/**/*.test.jsx"],
    setupFiles: ["src/app/test/setup.js"],
    globals: true
  }
});
