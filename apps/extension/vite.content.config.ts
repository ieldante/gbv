import { defineConfig } from "vite";
import gbvConfig from "../../gbv.config";

export default defineConfig({
  build: {
    outDir: gbvConfig.extension.buildDir.replace("apps/extension/", ""),
    emptyOutDir: false,
    lib: {
      entry: "src/contentScript.ts",
      formats: ["iife"],
      name: "GbvContentScript",
      fileName: () => "contentScript.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
