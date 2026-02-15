import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import gbvConfig from "../../gbv.config";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: gbvConfig.extension.buildDir.replace("apps/extension/", ""),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "index.html",
      },
    },
  },
});
