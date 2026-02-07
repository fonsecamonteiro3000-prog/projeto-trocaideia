import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20 md:py-32 bg-hero-gradient relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20">
            <Zap className="w-8 h-8 text-primary" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Pronto para conhecer pessoas novas?
          </h2>

          {/* Description */}
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Crie sua conta e comece a conversar agora mesmo com pessoas da sua região.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-7 text-lg shadow-glow hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Criar Conta Grátis
              </Button>
            </Link>
            
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-semibold px-10 py-7 text-lg transition-all duration-300 hover:scale-105 rounded-xl"
              >
                Já tenho conta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Trust badge */}
          <p className="mt-8 text-sm text-white/40">
            Gratuito para sempre. Sua privacidade garantida.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
