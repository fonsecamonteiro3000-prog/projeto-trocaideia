import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Shield, ArrowRight, Sparkles, UserX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const { signInAnonymously } = useAuth();
  const navigate = useNavigate();

  const handleAnonymous = () => {
    signInAnonymously();
    navigate("/chat");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-float" />
        <div
          className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[180px] animate-float"
          style={{ animationDelay: "3s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px]" />

        {/* Floating particles */}
        <div className="absolute top-20 right-1/4 w-2 h-2 bg-primary/60 rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 left-10 w-3 h-3 bg-primary/40 rounded-full animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-1/3 right-20 w-1.5 h-1.5 bg-primary/50 rounded-full animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute bottom-20 left-1/3 w-2.5 h-2.5 bg-primary/30 rounded-full animate-float" style={{ animationDelay: "5s" }} />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-28 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Top badge */}
          <div className="animate-fade-up flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm text-white/90 font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              Nova plataforma brasileira de chat
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-8">
            Converse com{" "}
            <span className="text-gradient">pessoas reais</span>
            <br />
            agora mesmo
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-center text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            Conexões espontâneas e seguras com pessoas da sua região.
            Chat de texto anônimo e em tempo real.
          </p>

          {/* CTA */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-7 text-lg shadow-glow hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Começar a Conversar
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

          {/* Anonymous CTA */}
          <div className="animate-fade-up-delay-3 flex justify-center mb-16">
            <button
              onClick={handleAnonymous}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all duration-300 hover:scale-105 text-sm"
            >
              <UserX className="w-4 h-4" />
              Entrar sem conta (anônimo)
            </button>
          </div>

          {/* Stats */}
          <div className="animate-fade-up-delay-3 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">10K+</p>
              <p className="text-xs md:text-sm text-white/50 mt-1">Usuários ativos</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">50K+</p>
              <p className="text-xs md:text-sm text-white/50 mt-1">Conversas/dia</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">99%</p>
              <p className="text-xs md:text-sm text-white/50 mt-1">Segurança</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
