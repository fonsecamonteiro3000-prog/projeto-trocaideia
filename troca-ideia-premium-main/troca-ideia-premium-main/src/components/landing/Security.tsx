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
    <section id="seguranca" className="py-20 md:py-32 bg-background">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sua segurança é prioridade
            </h2>
            <p className="text-muted-foreground text-lg">
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
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
                  <feature.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Trust banner */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-center">
            <p className="text-foreground font-medium">
              Mais de <span className="text-primary font-bold">50.000 usuários</span> confiam no TrocaIdeia todos os dias.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
