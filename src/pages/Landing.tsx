import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Shield,
  FileText,
  Share2,
  Lock,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

// Importando imagens diretamente como componentes React
// em vez de usar caminhos relativos
import dashboardPreview from "/dashboard-preview.svg";
import filePreview from "/file-preview.svg";
import securityPreview from "/security-preview.svg";
import placeholderImage from "/placeholder.svg";

const features = [
  {
    icon: <Shield className="h-10 w-10" />,
    key: "security",
  },
  {
    icon: <FileText className="h-10 w-10" />,
    key: "organization",
  },
  {
    icon: <Share2 className="h-10 w-10" />,
    key: "sharing",
  },
  {
    icon: <Smartphone className="h-10 w-10" />,
    key: "anywhere",
  },
];

const testimonials = [
  {
    name: "Maria Silva",
    role: "Gerente de Projetos",
    content:
      "O Secure File Safari revolucionou a forma como gerenciamos documentos sensíveis em nossa empresa. A interface é intuitiva e a segurança é incomparável.",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    name: "Carlos Mendes",
    role: "Advogado",
    content:
      "Como profissional que lida com documentos confidenciais, encontrei no Secure File Safari a tranquilidade que precisava. A autenticação de dois fatores com lembrete de dispositivo é essencial.",
    avatar: "https://i.pravatar.cc/150?img=67",
  },
  {
    name: "Ana Costa",
    role: "Designer",
    content:
      "A organização por cores e categorias facilita muito encontrar meus arquivos de design. A visualização em grade é perfeita para identificar rapidamente o que preciso.",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
];

export default function Landing() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const heroRef = React.useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detectar scroll para mudar a aparência do header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Moderno e Elegante */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "py-3 bg-background/95 backdrop-blur-md shadow-sm border-b border-muted/40"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between relative">
            {/* Logo com animação sutil */}
            <Link
              to="/"
              className="flex items-center gap-2 z-20 group transition-transform duration-300 hover:scale-105"
            >
              <Shield
                className={`h-6 w-6 transition-colors duration-300 ${
                  scrolled ? "text-primary" : "text-primary"
                }`}
              />
              <span
                className={`text-lg font-bold transition-all duration-300 ${
                  scrolled ? "text-foreground" : "text-foreground"
                } group-hover:text-primary`}
              >
                Secure File Safari
              </span>
            </Link>

            {/* Menu Desktop Elegante */}
            <div className="hidden md:flex items-center gap-8">
              <nav className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  className="text-base font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
                  onClick={scrollToFeatures}
                >
                  {t("landing.nav.features")}
                </Button>
                <Button
                  variant="ghost"
                  className="text-base font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
                >
                  {t("landing.nav.pricing")}
                </Button>
              </nav>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  aria-label="Language"
                >
                  <Globe className="h-5 w-5" />
                </Button>
              </div>

              {/* Botões de ação com efeitos refinados */}
              <div className="flex items-center gap-3">
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    className="px-5 py-2 font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary border-b-2 border-transparent hover:border-primary"
                  >
                    {t("landing.nav.login")}
                  </Button>
                </Link>
                <Link to="/auth?signup=true">
                  <Button className="px-5 py-2 font-medium transition-all duration-300 bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md">
                    {t("landing.nav.register")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Menu mobile com efeitos elegantes */}
            <div className="md:hidden flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full transition-colors duration-300 hover:bg-primary/10"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full transition-colors duration-300 ${
                  mobileMenuOpen
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-primary/10"
                }`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Menu Mobile Overlay com animações aprimoradas */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-md"
            >
              <div className="container mx-auto px-4 py-6 flex flex-col space-y-5">
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-md"
                  onClick={() => {
                    scrollToFeatures();
                    setMobileMenuOpen(false);
                  }}
                >
                  {t("landing.nav.features")}
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("landing.nav.pricing")}
                </Button>
                <div className="h-px bg-muted my-2"></div>
                <Link
                  to="/auth"
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant="outline"
                    className="w-full py-3 transition-all duration-300 hover:border-primary"
                  >
                    {t("landing.nav.login")}
                  </Button>
                </Link>
                <Link
                  to="/auth?signup=true"
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full py-3 transition-all duration-300 hover:bg-primary/90">
                    {t("landing.nav.register")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-background via-background to-background/80 relative overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl"></div>
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-accent/20 rounded-full filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-1 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                  {t("landing.hero.title")
                    .split(" seguro")
                    .map((part, i) =>
                      i === 0 ? (
                        <React.Fragment key={i}>
                          {part}
                          <span className="text-primary"> seguro</span>
                        </React.Fragment>
                      ) : (
                        part
                      )
                    )}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8">
                  {t("landing.hero.description")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link to="/auth?signup=true">
                    <Button size="lg" className="w-full sm:w-auto">
                      {t("landing.hero.startNow")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={scrollToFeatures}
                  >
                    {t("landing.hero.seeFeatures")}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Criptografia de ponta a ponta</span>
                  <CheckCircle2 className="h-4 w-4 text-primary ml-4" />
                  <span>Autenticação de dois fatores</span>
                  <CheckCircle2 className="h-4 w-4 text-primary ml-4" />
                  <span>Sem limite de arquivos</span>
                </div>
              </motion.div>
            </div>

            <div className="flex-1 w-full max-w-xl">
              <motion.div
                className="relative rounded-lg border overflow-hidden shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-full relative aspect-[16/9] bg-gradient-to-br from-background to-muted rounded-lg overflow-hidden">
                  <img
                    src={dashboardPreview}
                    alt="Dashboard Preview"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.classList.add(
                        "bg-muted",
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                      e.currentTarget.src = placeholderImage;
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the content */}
      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("landing.features.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-card rounded-xl p-8 border shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t(`landing.features.${feature.key}.title`)}
                </h3>
                <p className="text-muted-foreground">
                  {t(`landing.features.${feature.key}.description`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="rounded-lg overflow-hidden shadow-xl border"
              >
                <img
                  src={filePreview}
                  alt="File Explorer Preview"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.classList.add("bg-muted", "aspect-video");
                    e.currentTarget.src = placeholderImage;
                  }}
                />
              </motion.div>
            </div>

            <div className="flex-1 order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  {t("landing.interface.title")}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {t("landing.interface.description")}
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {t("landing.interface.customizable.title")}
                      </h4>
                      <p className="text-muted-foreground">
                        {t("landing.interface.customizable.description")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {t("landing.interface.previews.title")}
                      </h4>
                      <p className="text-muted-foreground">
                        {t("landing.interface.previews.description")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {t("landing.interface.oneClick.title")}
                      </h4>
                      <p className="text-muted-foreground">
                        {t("landing.interface.oneClick.description")}
                      </p>
                    </div>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  {t("landing.security.title")}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {t("landing.security.description")}
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {t("landing.security.twoFactor.title")}
                      </h4>
                      <p className="text-muted-foreground">
                        {t("landing.security.twoFactor.description")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {t("landing.security.encryption.title")}
                      </h4>
                      <p className="text-muted-foreground">
                        {t("landing.security.encryption.description")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {t("landing.security.links.title")}
                      </h4>
                      <p className="text-muted-foreground">
                        {t("landing.security.links.description")}
                      </p>
                    </div>
                  </li>
                </ul>
              </motion.div>
            </div>

            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="rounded-lg overflow-hidden shadow-xl border"
              >
                <img
                  src={securityPreview}
                  alt="Security Features"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.classList.add("bg-muted", "aspect-video");
                    e.currentTarget.src = placeholderImage;
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.testimonials.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("landing.testimonials.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-card rounded-xl p-6 border shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                    onError={(e) => {
                      e.currentTarget.src = placeholderImage;
                    }}
                  />
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="italic text-muted-foreground">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t("landing.cta.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("landing.cta.description")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth?signup=true">
                  <Button size="lg">{t("landing.cta.createAccount")}</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg">
                    {t("landing.cta.login")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Secure File Safari</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t("landing.footer.tagline")}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-medium mb-4">
                  {t("landing.footer.product")}
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Button variant="link" className="p-0 h-auto">
                      {t("landing.footer.features")}
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto">
                      {t("landing.footer.pricing")}
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto">
                      {t("landing.footer.security")}
                    </Button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-4">
                  {t("landing.footer.company")}
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Button variant="link" className="p-0 h-auto">
                      {t("landing.footer.about")}
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto">
                      {t("landing.footer.blog")}
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto">
                      {t("landing.footer.contact")}
                    </Button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-4">
                  {t("landing.footer.legal")}
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Button variant="link" className="p-0 h-auto">
                      {t("landing.footer.privacy")}
                    </Button>
                  </li>
                  <li>
                    <Button variant="link" className="p-0 h-auto">
                      {t("landing.footer.terms")}
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-muted flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Secure File Safari.{" "}
              {t("landing.footer.copyright")}
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
