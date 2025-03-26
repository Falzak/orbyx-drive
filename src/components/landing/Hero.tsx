import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Shield,
  Lock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Importando imagens
import dashboardPreview from "/dashboard-preview.svg";
import placeholderImage from "/placeholder.svg";

interface HeroProps {
  scrollToFeatures: () => void;
}

// Componente para as partículas flutuantes no fundo
const BackgroundParticles = () => {
  return (
    <>
      {Array.from({ length: 16 }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "absolute rounded-full bg-primary/10 z-10",
            index % 2 === 0 ? "h-4 w-4" : "h-6 w-6",
            index % 3 === 0 ? "bg-secondary/10" : "bg-primary/10"
          )}
          initial={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            opacity: 0.1,
          }}
          animate={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 90 + 5}%`,
          }}
        />
      ))}
    </>
  );
};

export const Hero: React.FC<HeroProps> = ({ scrollToFeatures }) => {
  const { t } = useTranslation();

  const heroFeatures = [
    {
      icon: <Lock className="h-4 w-4 text-primary" />,
      text: t("landing.security.encryption.title"),
    },
    {
      icon: <Shield className="h-4 w-4 text-primary" />,
      text: t("landing.security.twoFactor.title"),
    },
    {
      icon: <FileText className="h-4 w-4 text-primary" />,
      text: t("landing.features.anywhere.title"),
    },
  ];

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-background to-background/95 relative overflow-hidden">
      {/* Efeito de fundo melhorado com opacidade ajustada para transição fluida */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-48 h-48 bg-accent/20 rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Transição suave para a próxima seção */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-muted/20 pointer-events-none"></div>

      {/* Partículas animadas */}
      <BackgroundParticles />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 mb-6 bg-background/50 backdrop-blur-md border-primary/20 text-primary">
                <span className="text-xs font-medium">
                  {t("landing.version.new")}
                </span>
                <div className="h-3 w-px bg-primary/20 mx-2"></div>
                <span className="text-xs">{t("landing.version.released")}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight">
                {t("landing.hero.title")
                  .split(" seguro")
                  .map((part, i) =>
                    i === 0 ? (
                      <React.Fragment key={i}>
                        {part}
                        <span className="text-primary relative">
                          <span className="relative z-10"> seguro</span>
                          <motion.span
                            className="absolute bottom-1 left-0 h-3 w-full bg-primary/15 rounded-full -z-10"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                          />
                        </span>
                      </React.Fragment>
                    ) : (
                      part
                    )
                  )}
              </h1>

              <motion.p
                className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
                {t("landing.hero.description")}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
              >
                <Link to="/auth?signup=true">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {t("landing.hero.startNow")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-6 rounded-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  onClick={scrollToFeatures}
                >
                  {t("landing.hero.seeFeatures")}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center gap-x-6 gap-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.7 }}
              >
                {heroFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-muted"
                  >
                    <div className="rounded-full bg-primary/10 p-1">
                      {feature.icon}
                    </div>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          <div className="flex-1 w-full max-w-xl">
            <motion.div
              className="relative rounded-xl border-2 overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 z-10 pointer-events-none"></div>
              <div className="w-full relative aspect-[16/9] bg-gradient-to-br from-background to-muted rounded-lg overflow-hidden">
                <img
                  src={dashboardPreview}
                  alt="Dashboard Preview"
                  className="w-full h-full object-cover rounded-lg z-0"
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

              {/* Decoração animada ao redor da imagem */}
              <motion.div
                className="absolute -bottom-2 -right-2 w-24 h-24 bg-primary/10 rounded-full filter blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -top-2 -left-2 w-20 h-20 bg-secondary/10 rounded-full filter blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  delay: 1,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
