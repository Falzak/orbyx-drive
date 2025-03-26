import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, Sun, Moon, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Importando o logo
import driveLogo from "/drive.svg";

interface NavigationProps {
  scrollToFeatures: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ scrollToFeatures }) => {
  const { t, i18n } = useTranslation();
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

  // Dados de idiomas disponíveis
  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "pt-BR", name: "Português", flag: "🇧🇷" },
  ];

  // Função para alterar o idioma
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "py-3 bg-background/80 backdrop-blur-xl shadow-sm border-b border-muted/40"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between relative">
          {/* Logo com animação sutil e efeito hover melhorado */}
          <Link
            to="/"
            className="flex items-center gap-2 z-20 group transition-transform duration-300 hover:scale-105"
          >
            <div className="relative">
              <img
                src={driveLogo}
                alt="Orbyx Drive"
                className="h-7 w-auto transition-all duration-300"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute -inset-2 rounded-full bg-primary/5 -z-10"
              />
            </div>
            <span className="text-lg font-bold transition-all duration-300 text-foreground group-hover:text-primary">
              Orbyx Drive
            </span>
          </Link>

          {/* Menu Desktop Elegante com itens dropdown */}
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex items-center space-x-6">
              <Button
                variant="ghost"
                className="text-base font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
                onClick={scrollToFeatures}
              >
                {t("landing.nav.features")}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-base font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary flex items-center gap-1.5 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
                  >
                    {t("landing.nav.solutions")}
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="w-48 bg-background/95 backdrop-blur-lg border-muted/50"
                >
                  <DropdownMenuItem>
                    {t("landing.nav.personal")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>{t("landing.nav.teams")}</DropdownMenuItem>
                  <DropdownMenuItem>
                    {t("landing.nav.enterprise")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                className="rounded-full transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:scale-105"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:scale-105 relative"
                    aria-label={t("common.languageSelector")}
                  >
                    <Globe className="h-5 w-5" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
                      <span className="text-[8px]">
                        {
                          languages.find((lang) => lang.code === i18n.language)
                            ?.flag
                        }
                      </span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 bg-background/95 backdrop-blur-lg border-muted/50"
                >
                  {languages.map((language) => (
                    <DropdownMenuItem
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`
                        flex items-center gap-2 px-3 py-2 cursor-pointer
                        hover:bg-accent/50 focus:bg-accent/50
                        transition-colors duration-150
                        ${
                          i18n.language === language.code
                            ? "bg-accent/30 font-medium"
                            : ""
                        }
                      `}
                    >
                      <span className="text-base">{language.flag}</span>
                      <span className="flex-1">{language.name}</span>
                      {i18n.language === language.code && (
                        <Check className="h-4 w-4 text-foreground/70" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Botões de ação com efeitos refinados */}
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button
                  variant="ghost"
                  className="px-5 py-2 font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:shadow-sm rounded-full"
                >
                  {t("landing.nav.login")}
                </Button>
              </Link>
              <Link to="/auth?signup=true">
                <Button className="px-6 py-2 font-medium transition-all duration-300 bg-primary hover:bg-primary/90 hover:shadow-lg rounded-full">
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
                  ? "bg-primary/20 text-primary"
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
            className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-md"
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

              <div className="space-y-2">
                <p className="px-4 text-sm font-medium text-muted-foreground">
                  {t("landing.nav.solutions")}
                </p>
                <Button
                  variant="ghost"
                  className="justify-start pl-8 py-2 text-sm w-full hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("landing.nav.personal")}
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start pl-8 py-2 text-sm w-full hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("landing.nav.teams")}
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start pl-8 py-2 text-sm w-full hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("landing.nav.enterprise")}
                </Button>
              </div>

              <Button
                variant="ghost"
                className="justify-start px-4 py-3 font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("landing.nav.pricing")}
              </Button>

              <div className="h-px bg-muted my-1"></div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTheme("light");
                  }}
                  className={`transition-all duration-200 ${
                    theme === "light"
                      ? "bg-primary/10 text-primary border-primary"
                      : ""
                  }`}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  {t("common.theme.light")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTheme("dark");
                  }}
                  className={`transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-primary/10 text-primary border-primary"
                      : ""
                  }`}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  {t("common.theme.dark")}
                </Button>
              </div>

              <div className="h-px bg-muted my-1"></div>

              <div className="grid grid-cols-2 gap-2">
                {languages.map((language) => (
                  <Button
                    key={language.code}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLanguageChange(language.code)}
                    className={`transition-all duration-200 ${
                      i18n.language === language.code
                        ? "bg-primary/10 text-primary border-primary"
                        : ""
                    }`}
                  >
                    <span className="mr-2">{language.flag}</span>
                    {language.name}
                  </Button>
                ))}
              </div>

              <div className="h-px bg-muted my-1"></div>

              <Link
                to="/auth"
                className="w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="outline"
                  className="w-full py-3 transition-all duration-300 hover:border-primary rounded-full"
                >
                  {t("landing.nav.login")}
                </Button>
              </Link>
              <Link
                to="/auth?signup=true"
                className="w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full py-3 transition-all duration-300 hover:bg-primary/90 rounded-full">
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
