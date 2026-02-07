import { Instagram, Twitter, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

const footerLinks = {
  institutional: [
    { label: "Termos de Uso", href: "#" },
    { label: "Política de Privacidade", href: "#" },
    { label: "Diretrizes da Comunidade", href: "#" },
  ],
  support: [
    { label: "Central de Ajuda", href: "#suporte" },
    { label: "Contato", href: "#" },
    { label: "FAQ", href: "#" },
  ],
};

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="suporte" className="bg-secondary border-t border-border/20">
      <div className="container px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="inline-block mb-4">
              <img src={logo} alt="TrocaIdeia" className="h-10 w-auto" />
            </a>
            <p className="text-secondary-foreground/60 text-sm leading-relaxed max-w-sm mb-6">
              Conectando pessoas próximas através de conversas espontâneas e seguras. A plataforma brasileira de chat aleatório.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center text-secondary-foreground/60 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Institutional links */}
          <div>
            <h4 className="font-semibold text-secondary-foreground mb-4">Institucional</h4>
            <ul className="space-y-3">
              {footerLinks.institutional.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-semibold text-secondary-foreground mb-4">Suporte</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-secondary-foreground/40">
              © {currentYear} TrocaIdeia. Todos os direitos reservados.
            </p>
            <p className="text-sm text-secondary-foreground/40">
              Feito com carinho no Brasil
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
