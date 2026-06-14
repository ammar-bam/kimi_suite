import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f5f6f8",
        foreground: "#0f172a",
        brand: "#0f766e",
        accent: "#f59e0b"
      }
    }
  },
  plugins: []
};

export default config;
