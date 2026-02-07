import { useState, useRef, useEffect } from "react";

interface GenderSelectorProps {
  value?: "male" | "female" | "other";
  onChange: (gender: "male" | "female" | "other") => void;
}

const GENDERS = [
  { id: "male" as const, label: "Menino", emoji: "👦" },
  { id: "female" as const, label: "Menina", emoji: "👧" },
  { id: "other" as const, label: "Outro", emoji: "🧑" },
];

const GenderSelector = ({ value, onChange }: GenderSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = GENDERS.find((g) => g.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-all transform hover:scale-105 active:scale-95 min-w-0 sm:min-w-[100px]"
      >
        <span className="text-base sm:text-xl">{selected?.emoji || "🧑"}</span>
        <span className="hidden sm:inline">Eu sou</span> {selected?.label || "..."}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden min-w-[180px] sm:min-w-[200px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 border-b border-gray-200 dark:border-white/10">
            <p className="text-xs text-gray-400 text-center font-medium">Eu sou...</p>
          </div>
          {GENDERS.map((gender) => (
            <button
              key={gender.id}
              onClick={() => {
                onChange(gender.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors ${
                value === gender.id
                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                  : "text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              }`}
            >
              <span className="text-2xl">{gender.emoji}</span>
              <span className="font-medium">{gender.label}</span>
              {value === gender.id && (
                <span className="ml-auto text-green-400 text-sm">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenderSelector;
