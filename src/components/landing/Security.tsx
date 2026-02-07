import { Flag, Ban, Eye } from "lucide-react";

const securityFeatures = [
  {
    icon: Flag,
    title: "Denúncia Rápida",
    description: "Com apenas 1 clique, denuncie comportamentos inadequados. Nossa equipe analisa em tempo real.",
  },
  {
    icon: Ban,
    title: "Bloqueio Instantâneo",
    description: "Não gostou da conversa? Bloqueie imediatamente e nunca mais encontre essa pessoa.",
  },
  {
    icon: Eye,
    title: "Moderação 24/7",
    description: "Equipe dedicada monitorando a plataforma dia e noite para garantir sua segurança.",
  },
];

const Security = () => {
  return (
    <section id="seguranca" className="py-20 md:py-32 bg-gray-50 dark:bg-[#0d0d0d]">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Sua segurança é prioridade
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Desenvolvemos ferramentas robustas para que você converse com tranquilidade.
            </p>
          </div>

          {/* Security features */}
          <div className="grid md:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="text-center group"
              >
                {/* Icon */}
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                  <feature.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Trust banner */}
          <div className="mt-16 p-8 rounded-2xl bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 text-center">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Mais de <span className="text-green-600 dark:text-green-400 font-bold">50.000 usuários</span> confiam no TrocaIdeia todos os dias.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
