import { Button } from "@/components/ui/button";
import { MessageCircle, Video } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-1/4 w-32 h-32 border border-primary/20 rounded-full" />
        <div className="absolute bottom-32 left-1/4 w-24 h-24 border border-primary/10 rotate-45" />
        <div className="absolute top-1/3 right-10 w-2 h-2 bg-primary/40 rounded-full" />
        <div className="absolute bottom-1/3 left-20 w-3 h-3 bg-primary/30 rounded-full" />
      </div>

      {/* Content */}
      <div className="container relative z-10 text-center px-4 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-up mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-glass text-sm text-primary-foreground/80">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Mais de 10.000 conexões diárias
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
            Troque Ideia com pessoas{" "}
            <span className="text-gradient">próximas de você</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10">
            Conexões espontâneas, conversas reais, em tempo real.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
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

          {/* Trust indicator */}
          <p className="animate-fade-up-delay-3 mt-8 text-sm text-primary-foreground/50">
            Sem cadastro necessário. Comece em segundos.
          </p>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
