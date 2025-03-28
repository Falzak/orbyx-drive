import React from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Star,
  CheckCircle2,
  Rocket,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Componente de partículas/formas decorativas em 3D para o fundo
const DecorativeParticles = () => {
  return (
    <>
      {Array.from({ length: 12 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          initial={{
            scale: 0.6,
            opacity: 0.3,
            x: -10,
            y: -10,
            z: 0,
          }}
          animate={{
            scale: [0.7, 0.9, 0.7],
            opacity: [0.2, 0.4, 0.2],
            x: Math.random() * 30 - 15,
            y: Math.random() * 30 - 15,
            z: [0, 30, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: index * 0.3,
          }}
          style={{
            width: 15 + Math.random() * 40,
            height: 15 + Math.random() * 40,
            left: `${5 + Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            background:
              index % 3 === 0
                ? "linear-gradient(135deg, rgba(var(--primary-rgb) / 0.2), rgba(var(--primary-rgb) / 0.05))"
                : index % 3 === 1
                ? "linear-gradient(135deg, rgba(var(--secondary-rgb) / 0.15), rgba(var(--secondary-rgb) / 0.05))"
                : "linear-gradient(135deg, rgba(var(--accent-rgb) / 0.1), rgba(var(--accent-rgb) / 0.03))",
            boxShadow: "0 0 20px rgba(var(--primary-rgb) / 0.1)",
            filter: "blur(1px)",
          }}
        />
      ))}
    </>
  );
};

// Componente para recursos visuais destacados
const FeatureHighlight = ({
  icon,
  title,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  index: number;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className="flex items-center rounded-full bg-background/80 backdrop-blur-sm px-4 py-2 border border-primary/10 shadow-sm"
      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20, y: 10 }}
      animate={
        isInView
          ? {
              opacity: 1,
              x: 0,
              y: 0,
              transition: {
                duration: 0.5,
                delay: 0.2 + index * 0.1,
              },
            }
          : {}
      }
      whileHover={{
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(var(--primary-rgb) / 0.15)",
        borderColor: "rgba(var(--primary-rgb) / 0.3)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="mr-2 text-primary">{icon}</div>
      <span className="text-sm font-medium">{title}</span>
    </motion.div>
  );
};

export const CTASection = () => {
  const { t } = useTranslation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  // Lista de recursos com ícones
  const features = [
    { icon: <Lock size={16} />, title: "Segurança Avançada" },
    { icon: <CheckCircle2 size={16} />, title: "Organização Intuitiva" },
    { icon: <ArrowRight size={16} />, title: "Compartilhamento" },
    { icon: <Rocket size={16} />, title: "Alta Performance" },
  ];

  // Variantes de animação para efeito de cascata
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-background/80 via-background/90 to-background">
      {/* Transição suave da seção anterior */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background/80 to-transparent pointer-events-none"></div>

      {/* Gradiente de fundo mais dinâmico */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/10 to-secondary/5"></div>

      {/* Partículas decorativas animadas */}
      <div className="absolute inset-0 overflow-hidden opacity-60 pointer-events-none">
        <DecorativeParticles />

        <motion.div
          className="absolute -top-48 -left-48 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />

        <motion.div
          className="absolute -bottom-48 -right-48 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "mirror",
            delay: 5,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div ref={ref} className="max-w-5xl mx-auto">
          <motion.div
            className="bg-background/60 backdrop-blur-lg rounded-3xl p-8 md:p-16 border border-muted/40 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            {/* Brilho superior */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

            <motion.div
              className="text-center mb-10"
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <motion.div
                className="inline-flex items-center justify-center mb-6"
                variants={itemVariants}
              >
                <div className="rounded-full bg-primary/10 p-5 relative">
                  <ShieldCheck className="h-10 w-10 text-primary relative z-10" />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/5"
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </motion.div>

              <motion.h2
                className="text-3xl md:text-5xl font-bold mb-5 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80"
                variants={itemVariants}
              >
                {t("landing.cta.title")}
              </motion.h2>

              <motion.div
                className="flex items-center justify-center gap-3 mb-7"
                variants={itemVariants}
              >
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-primary/70 to-transparent"></div>
                <Sparkles className="h-6 w-6 text-primary/70" />
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-primary/70 to-transparent"></div>
              </motion.div>

              <motion.p
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
                variants={itemVariants}
              >
                {t("landing.cta.description")}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-5"
                variants={itemVariants}
              >
                <Link to="/auth?signup=true">
                  <Button
                    size="lg"
                    className="px-8 py-7 text-base rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-primary to-primary/90 relative overflow-hidden group"
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 z-0"
                      initial={{ x: "-100%", opacity: 0 }}
                      whileHover={{
                        x: "100%",
                        opacity: 1,
                        transition: { duration: 1, ease: "easeInOut" },
                      }}
                    />
                    <span className="relative z-10 flex items-center">
                      {t("landing.cta.createAccount")}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-7 text-base rounded-full border-primary/20 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/5"
                  >
                    {t("landing.cta.login")}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Recursos em design mais moderno */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.7 }}
            >
              {features.map((feature, index) => (
                <FeatureHighlight
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  index={index}
                />
              ))}
            </motion.div>

            {/* Indicador de avaliação com estrelas */}
            <motion.div
              className="flex items-center justify-center mt-10 gap-2"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={
                    isInView
                      ? {
                          scale: 1,
                          rotate: 0,
                          transition: {
                            delay: 1 + i * 0.1,
                            type: "spring",
                            stiffness: 200,
                          },
                        }
                      : {}
                  }
                >
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Mensagem de incentivo abaixo do CTA principal */}
        <motion.div
          className="text-center mt-10 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <p className="text-muted-foreground">
            Comece{" "}
            <span className="text-primary font-medium">gratuitamente</span>{" "}
            hoje. Sem necessidade de cartão de crédito.
          </p>

          <motion.div
            className="flex items-center justify-center text-sm text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2 text-primary/70" />
            <span>Mais de 10.000 usuários confiam no Orbyx Drive</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
