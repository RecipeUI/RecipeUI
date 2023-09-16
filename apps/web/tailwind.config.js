/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        chefYellow: "#F0A500",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      borderColor: (theme) => ({
        ...theme("colors"),
        DEFAULT: theme("colors.slate.600", "currentColor"),
        primary: "#3490dc",
        secondary: "#ffed4a",
        danger: "#e3342f",
      }),
    },
  },
  plugins: [require("daisyui")],
};
