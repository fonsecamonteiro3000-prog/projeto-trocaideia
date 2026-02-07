import { Button } from "@/components/ui/button";
import { Video, ArrowRight, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const CTA = () => {
  const { signInAnonymously } = useAuth();
  const navigate = useNavigate();

  const handleAnonymous = () => {
    signInAnonymously();
    navigate("/chat");
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 dark:from-green-900 dark:via-green-800 dark:to-emerald-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-[150px]" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20">
            <Zap className="w-8 h-8 text-white" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Pronto para conhecer pessoas novas?
          </h2>

          {/* Description */}
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Comece a conversar agora mesmo — sem cadastro obrigatório, gratuito e seguro.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleAnonymous}
              className="w-full sm:w-auto bg-white hover:bg-gray-100 text-green-600 font-bold px-10 py-7 text-lg shadow-xl transition-all duration-300 hover:scale-105 rounded-xl"
            >
              <Video className="mr-2 h-5 w-5" />
              Quero conversar agora
            </Button>
            
            <Link to="/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold px-10 py-7 text-lg transition-all duration-300 hover:scale-105 rounded-xl"
              >
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Trust badge */}
          <p className="mt-8 text-sm text-white/60">
            Gratuito para sempre. Sua privacidade garantida.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
