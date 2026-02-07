import { Button } from "@/components/ui/button";
import { MessageCircle, Video, Zap } from "lucide-react";

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
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Pronto para conhecer pessoas novas?
          </h2>

          {/* Description */}
          <p className="text-lg text-primary-foreground/70 mb-10 max-w-xl mx-auto">
            Sem cadastro, sem complicação. Comece a conversar agora mesmo com pessoas da sua região.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg shadow-glow hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Conversar por Mensagem
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-2 border-primary-foreground/30 bg-transparent hover:bg-primary-foreground/10 text-primary-foreground font-semibold px-8 py-6 text-lg transition-all duration-300 hover:scale-105"
            >
              <Video className="mr-2 h-5 w-5" />
              Conversar por Vídeo
            </Button>
          </div>

          {/* Trust badge */}
          <p className="mt-8 text-sm text-primary-foreground/50">
            Gratuito para sempre. Sua privacidade garantida.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
