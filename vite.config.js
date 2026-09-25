import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    // Videos, fonts and posters live in public/ and are copied as-is.
    assetsInlineLimit: 0,
  },
});
