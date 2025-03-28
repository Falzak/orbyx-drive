import React from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronDown, Lock, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Importando imagens
import dashboardPreview from "/dashboard-preview.svg";
import placeholderImage from "/placeholder.svg";

interface HeroProps {
  scrollToFeatures: () => void;
}

// Variantes de animação para o stagger effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] },
  },
};

// Componente para as partículas flutuantes no fundo
const BackgroundParticles = () => {
  return (
    <>
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "absolute rounded-full z-10",
            index % 2 === 0 ? "h-3 w-3" : "h-5 w-5",
            index % 3 === 0
              ? "bg-secondary/10"
              : index % 4 === 0
              ? "bg-accent/10"
              : "bg-primary/10"
          )}
          initial={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0.1,
          }}
          animate={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            opacity: [0.1, 0.3, 0.1],
            scale: [1, Math.random() * 0.3 + 1, 1],
          }}
          transition={{
            duration: 6 + Math.random() * 8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
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
  const { scrollY } = useScroll();

  // Efeito de paralaxe
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);

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
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-background via-background to-background/95 relative overflow-hidden">
      {/* Efeito de gradiente dinâmico */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-80 h-80 bg-primary/10 rounded-full filter blur-[100px] animate-blob" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-secondary/10 rounded-full filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-accent/10 rounded-full filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Transição suave para a próxima seção */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>

      {/* Partículas animadas */}
      <BackgroundParticles />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex-1 max-w-2xl" style={{ opacity }}>
            <motion.div className="relative z-10" variants={containerVariants}>
              <motion.div
                className="inline-flex items-center rounded-full border px-4 py-1.5 mb-8 bg-background/60 backdrop-blur-md border-primary/20 text-primary shadow-sm"
                variants={itemVariants}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <span className="text-xs font-medium">
                  {t("landing.version.new")}
                </span>
                <div className="h-3 w-px bg-primary/20 mx-2"></div>
                <span className="text-xs">{t("landing.version.released")}</span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight"
                variants={itemVariants}
              >
                <div className="inline-block">
                  <span>{t("landing.hero.title").split(" seguro")[0]}</span>{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-primary">seguro</span>
                    <motion.span
                      className="absolute bottom-2 left-0 h-4 w-full bg-primary/15 rounded-full -z-10"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{
                        delay: 0.7,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                    />
                  </span>
                  <span>
                    {t("landing.hero.title").split(" seguro")[1] || ""}
                  </span>
                </div>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed"
                variants={itemVariants}
              >
                {t("landing.hero.description")}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-10"
                variants={itemVariants}
              >
                <Link to="/auth?signup=true">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 bg-gradient-to-r from-primary to-primary/90"
                  >
                    {t("landing.hero.startNow")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-6 rounded-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-muted-foreground/30 hover:border-primary/50 hover:bg-background"
                  onClick={scrollToFeatures}
                >
                  {t("landing.hero.seeFeatures")}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center gap-x-6 gap-y-3"
              >
                {heroFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground bg-background/60 backdrop-blur-sm px-3.5 py-2 rounded-full border border-muted/50 shadow-sm hover:shadow hover:border-muted/80 transition-all duration-300"
                    whileHover={{
                      y: -2,
                      scale: 1.02,
                      transition: { duration: 0.2 },
                    }}
                  >
                    <div className="rounded-full bg-primary/10 p-1.5">
                      {feature.icon}
                    </div>
                    <span>{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div className="flex-1 w-full max-w-xl" style={{ y, opacity }}>
            <motion.div
              className="relative rounded-xl overflow-hidden shadow-2xl border border-muted/30"
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                transition: { duration: 0.3 },
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 z-10 pointer-events-none"></div>
              <div className="w-full relative aspect-[16/9] bg-gradient-to-br from-background to-muted/80 rounded-lg overflow-hidden">
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
                className="absolute -bottom-2 -right-2 w-32 h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full filter blur-xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 7,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -top-2 -left-2 w-24 h-24 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-full filter blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 8,
                  delay: 1,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
