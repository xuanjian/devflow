import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleApiRequest } from "../server.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "context-studio-api",
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          try {
            const handled = await handleApiRequest({
              request,
              response,
              rootDir: process.cwd()
            });
            if (!handled) {
              next();
            }
          } catch (error) {
            response.statusCode = 500;
            response.setHeader("content-type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: { code: "server_error", message: error.message } }));
          }
        });
      }
    }
  ]
});
