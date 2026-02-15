import { defineConfig } from "vite";
import gbvConfig from "../../gbv.config";

export default defineConfig({
  build: {
    outDir: gbvConfig.extension.buildDir.replace("apps/extension/", ""),
    emptyOutDir: false,
    lib: {
      entry: "src/background.ts",
      formats: ["iife"],
      name: "GbvBackground",
      fileName: () => "background.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
