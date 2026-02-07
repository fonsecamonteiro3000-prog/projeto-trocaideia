import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

interface CountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
}

const COUNTRIES = [
  { code: "BR", flag: "🇧🇷", name: "Brasil" },
  { code: "PT", flag: "🇵🇹", name: "Portugal" },
  { code: "US", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "CO", flag: "🇨🇴", name: "Colômbia" },
  { code: "MX", flag: "🇲🇽", name: "México" },
  { code: "ES", flag: "🇪🇸", name: "Espanha" },
  { code: "FR", flag: "🇫🇷", name: "França" },
  { code: "DE", flag: "🇩🇪", name: "Alemanha" },
  { code: "IT", flag: "🇮🇹", name: "Itália" },
  { code: "GB", flag: "🇬🇧", name: "Reino Unido" },
  { code: "JP", flag: "🇯🇵", name: "Japão" },
  { code: "KR", flag: "🇰🇷", name: "Coreia do Sul" },
  { code: "ANY", flag: "🌍", name: "Qualquer país" },
];

const CountrySelector = ({ value, onChange }: CountrySelectorProps) => {
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

  const selected = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-all transform hover:scale-105 active:scale-95 min-w-0 sm:min-w-[100px]"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">País</span> {selected.flag}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden min-w-[200px] sm:min-w-[220px] max-h-[280px] sm:max-h-[320px] overflow-y-auto z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-[#1a1a2e]">
            <p className="text-xs text-gray-400 text-center font-medium">Filtrar por país</p>
          </div>
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              onClick={() => {
                onChange(country.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-left transition-colors ${
                value === country.code
                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                  : "text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              }`}
            >
              <span className="text-xl">{country.flag}</span>
              <span className="font-medium text-sm">{country.name}</span>
              {value === country.code && (
                <span className="ml-auto text-green-400 text-sm">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
