import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./lib/openapi.json", // sign up at app.heyapi.dev
  output: "lib/client",
  plugins: ["@tanstack/react-query"],
});
