import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Shield, Menu, X, Globe, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface NavigationProps {
  scrollToFeatures: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ scrollToFeatures }) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
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

  return (
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
  );
};
