import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trocaideia_theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("trocaideia_theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
        isDark
          ? "bg-white/10 hover:bg-white/20 text-yellow-400"
          : "bg-black/10 hover:bg-black/20 text-gray-700"
      } ${className}`}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Modo Claro" : "Modo Escuro"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
