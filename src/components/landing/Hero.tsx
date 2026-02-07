import { Button } from "@/components/ui/button";
import { Video, Users, Shield, ArrowRight, Zap, Globe, UserX } from "lucide-react";
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-[#0a1a10] dark:via-[#0d1f14] dark:to-[#0a1a10]">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-green-400/15 dark:bg-green-500/10 rounded-full blur-[120px] animate-float" />
        <div
          className="absolute -bottom-60 -left-40 w-[700px] h-[700px] bg-emerald-300/15 dark:bg-emerald-500/8 rounded-full blur-[150px] animate-float"
          style={{ animationDelay: "3s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-200/20 dark:bg-green-600/5 rounded-full blur-[180px]" />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(142 71% 45% / 0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating accent circles */}
        <div className="absolute top-24 right-[15%] w-3 h-3 bg-green-400/50 rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] left-[8%] w-4 h-4 bg-emerald-400/30 rounded-full animate-float" style={{ animationDelay: "2.5s" }} />
        <div className="absolute bottom-[30%] right-[10%] w-2.5 h-2.5 bg-green-500/40 rounded-full animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute top-[60%] left-[20%] w-2 h-2 bg-emerald-300/50 rounded-full animate-float" style={{ animationDelay: "5s" }} />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 pt-20 sm:pt-28 pb-12 sm:pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Top badge */}
          <div className="animate-fade-up flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-sm text-green-700 dark:text-green-400 font-semibold shadow-sm">
              <Zap className="w-4 h-4 text-green-500" />
              A plataforma brasileira de videochat
              <ArrowRight className="w-3.5 h-3.5 text-green-500" />
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-center text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight mb-4 sm:mb-6">
            <span className="text-gray-900 dark:text-white">Converse </span>
            <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 bg-clip-text text-transparent">ao vivo</span>
            <br />
            <span className="text-gray-900 dark:text-white">com </span>
            <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">pessoas reais</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-center text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            Videochat aleatório, seguro e gratuito. Conecte-se com pessoas do Brasil e do mundo inteiro — agora mesmo.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <Button
              size="lg"
              onClick={handleAnonymous}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold px-8 sm:px-12 py-4 sm:py-7 text-base sm:text-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 rounded-2xl"
            >
              <Video className="mr-2 h-5 w-5" />
              Quero conversar
            </Button>

            <Link to="/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-green-200 dark:border-green-500/30 bg-white/80 dark:bg-white/5 backdrop-blur-sm hover:bg-green-50 dark:hover:bg-green-500/10 text-green-700 dark:text-green-400 font-semibold px-8 sm:px-10 py-4 sm:py-7 text-base sm:text-lg transition-all duration-300 hover:scale-105 rounded-2xl"
              >
                Criar conta grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Login link */}
          <div className="animate-fade-up-delay-3 flex justify-center mb-14">
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors duration-300"
            >
              Já tem conta? <span className="underline underline-offset-2">Fazer login</span>
            </Link>
          </div>

          {/* Feature pills */}
          <div className="animate-fade-up-delay-3 flex flex-wrap items-center justify-center gap-3 mb-16">
            {[
              { icon: <UserX className="w-4 h-4" />, text: "Sem cadastro obrigatório" },
              { icon: <Shield className="w-4 h-4" />, text: "100% seguro" },
              { icon: <Globe className="w-4 h-4" />, text: "Brasil e mundo" },
            ].map((pill) => (
              <span
                key={pill.text}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-400 font-medium shadow-sm"
              >
                <span className="text-green-500">{pill.icon}</span>
                {pill.text}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="animate-fade-up-delay-3 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">10K+</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-0.5 sm:mt-1">Usuários ativos</p>
            </div>
            <div className="text-center p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <Video className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">50K+</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-0.5 sm:mt-1">Videochats/dia</p>
            </div>
            <div className="text-center p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">99%</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-0.5 sm:mt-1">Segurança</p>
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
