/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        Poppins: ["Poppins", "sans-serif"],
      },
      backgroundColor: {
        primary: "#101010",
      },
      boxShadow: {
        primary: "0 5px 10px -2px #000",
      },
    },
  },
  plugins: [],
};
