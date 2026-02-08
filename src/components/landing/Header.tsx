import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, MessageSquare, UserCircle, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAnonymous, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = !!user || isAnonymous;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#seguranca", label: "Segurança" },
    { href: "#suporte", label: "Suporte" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200 dark:border-white/10"
          : "bg-white/60 dark:bg-black/40 backdrop-blur-xl border-b border-gray-100 dark:border-white/10"
      }`}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="TrocaIdeia" className="h-10 sm:h-14 md:h-20 lg:h-24 w-auto max-w-[180px] sm:max-w-xs md:max-w-lg lg:max-w-xl" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-lg font-semibold text-gray-700 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {!loading && isLoggedIn ? (
              <>
                <Link to="/chat">
                  <Button
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 shadow-lg shadow-green-500/20 rounded-xl"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Ir para o Chat
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-white/20"
                    />
                  ) : (
                    <UserCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[120px] truncate font-medium">
                    {profile.displayName || "Usuário"}
                  </span>
                  {isAnonymous && (
                    <span className="text-[10px] bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-medium">
                      Anônimo
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-700 dark:text-white hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-white/10 font-semibold"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 shadow-lg shadow-green-500/20 rounded-xl"
                  >
                    Criar Conta
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-white"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 animate-fade-up">
            <nav className="flex flex-col py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-lg font-semibold text-gray-700 dark:text-white hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="px-4 pt-4 space-y-2">
                {!loading && isLoggedIn ? (
                  <>
                    <Link to="/chat" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ir para o Chat
                      </Button>
                    </Link>
                    <div className="flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-2">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-white/20"
                          />
                        ) : (
                          <UserCircle className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {profile.displayName || "Usuário"}
                        </span>
                        {isAnonymous && (
                          <span className="text-[10px] bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full font-medium">
                            Anônimo
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await signOut();
                          setIsMobileMenuOpen(false);
                          navigate("/");
                        }}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Sair
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-gray-200 dark:border-white/20 text-gray-700 dark:text-white hover:bg-green-50 dark:hover:bg-white/10 font-semibold"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/register" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
                      >
                        Criar Conta
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
