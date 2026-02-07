import { useState } from "react";
import { X, AlertTriangle, Flag } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReport: (category: string, detail: string) => void;
}

const REPORT_CATEGORIES = [
  { id: "offensive", label: "Ofensas", icon: "🤬", desc: "Xingamentos, ameaças ou discurso de ódio" },
  { id: "nudity", label: "Nudez", icon: "🔞", desc: "Conteúdo sexual ou nudez explícita" },
  { id: "harassment", label: "Assédio", icon: "⚠️", desc: "Comportamento abusivo ou perseguição" },
  { id: "inappropriate", label: "Conteúdo impróprio", icon: "🚫", desc: "Violência, drogas ou conteúdo ilegal" },
  { id: "other", label: "Outros", icon: "📝", desc: "Outro tipo de violação" },
];

const ReportModal = ({ isOpen, onClose, onReport }: ReportModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedCategory) return;
    onReport(selectedCategory, detail);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedCategory(null);
      setDetail("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Flag className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Denúncia enviada!</h3>
            <p className="text-gray-400">O chat foi encerrado. Obrigado por nos ajudar.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Denunciar</h3>
                  <p className="text-xs text-gray-400">Selecione o motivo</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="p-5 space-y-2">
              {REPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    selectedCategory === cat.id
                      ? "bg-red-500/20 border border-red-500/40"
                      : "bg-white/5 border border-transparent hover:bg-white/10"
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{cat.label}</p>
                    <p className="text-gray-400 text-xs">{cat.desc}</p>
                  </div>
                  {selectedCategory === cat.id && (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}

              {/* Detail input */}
              {selectedCategory && (
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Detalhes adicionais (opcional)..."
                  className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 resize-none h-20"
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedCategory}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold transition-colors"
              >
                Denunciar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
