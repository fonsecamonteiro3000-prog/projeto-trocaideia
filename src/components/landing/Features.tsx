import { Shield, MapPin, MessageSquare, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Conversas Anônimas",
    description: "Sua identidade protegida. Converse livremente sem expor dados pessoais.",
  },
  {
    icon: MapPin,
    title: "Pessoas Próximas",
    description: "Match regional inteligente. Conecte-se com pessoas da sua região.",
  },
  {
    icon: MessageSquare,
    title: "Texto ou Vídeo",
    description: "Escolha como conversar. Alterne entre chat de texto e videochamada.",
  },
  {
    icon: ShieldCheck,
    title: "Moderação Ativa",
    description: "Ambiente seguro 24/7. Equipe dedicada para manter a comunidade saudável.",
  },
];

const Features = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-32 bg-white dark:bg-[#111]">
      <div className="container px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Como funciona
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Uma plataforma pensada para conexões reais, com segurança e simplicidade.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 md:p-8 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-green-300 dark:hover:border-green-500/30 shadow-sm hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover accent */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
