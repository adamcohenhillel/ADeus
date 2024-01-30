import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        adeusCream: "#F5F4F0",
        adeusDark: "#155C3C",
        adeusRegular: "#4AA87A",
        adeusLight: "#B2E4CD",
        adeusLighter: "#d5e5d8",
      },
    },
  },
  plugins: [],
};
export default config;
