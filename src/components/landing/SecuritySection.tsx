import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Lock, Shield, Key, Fingerprint, CheckCircle } from "lucide-react";

// Importando imagens
import securityPreview from "/security-preview.svg";
import placeholderImage from "/placeholder.svg";

export const SecuritySection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const imageRef = useRef(null);
  const isContentInView = useInView(contentRef, { once: true, amount: 0.3 });
  const isImageInView = useInView(imageRef, { once: true, amount: 0.3 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Efeito de parallax suave
  const y1 = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.3, 1, 1, 0.3]
  );

  // Animações para a lista de recursos de segurança
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
        duration: 0.6,
      },
    },
  };

  const securityFeatures = [
    {
      icon: <Lock className="h-5 w-5 text-primary" />,
      key: "twoFactor",
      color: "bg-blue-500/15",
      borderColor: "border-blue-500/20",
      hoverColor: "group-hover:border-blue-500/40 group-hover:bg-blue-500/20",
    },
    {
      icon: <Key className="h-5 w-5 text-primary" />,
      key: "encryption",
      color: "bg-purple-500/15",
      borderColor: "border-purple-500/20",
      hoverColor:
        "group-hover:border-purple-500/40 group-hover:bg-purple-500/20",
    },
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      key: "links",
      color: "bg-green-500/15",
      borderColor: "border-green-500/20",
      hoverColor: "group-hover:border-green-500/40 group-hover:bg-green-500/20",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden"
    >
      {/* Gradiente de fundo dinâmico */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute inset-0 opacity-30" style={{ opacity }}>
          <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-secondary/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-gradient-to-tr from-secondary/10 to-primary/5 rounded-full blur-[100px]"></div>
        </motion.div>

        {/* Linhas decorativas */}
        <div className="absolute top-0 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
      </div>

      {/* Animated security symbols in background - mais sutis e elegantes */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none mix-blend-color-dodge">
        {Array.from({ length: 8 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute text-primary"
            initial={{
              opacity: 0.4,
              y: -20,
              scale: 0.8,
              x: Math.random() * 100 - 50,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              y: ["5%", "75%"],
              scale: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 1.5,
            }}
            style={{
              left: `${Math.random() * 90 + 5}%`,
            }}
          >
            {index % 3 === 0 ? (
              <Lock className="h-8 w-8" />
            ) : index % 3 === 1 ? (
              <Shield className="h-8 w-8" />
            ) : (
              <Key className="h-8 w-8" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 xl:gap-20">
          <motion.div
            ref={contentRef}
            className="flex-1 max-w-lg"
            style={{ y: y1 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={isContentInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <motion.div
                className="inline-flex items-center rounded-full border px-4 py-1.5 mb-8 bg-background/70 backdrop-blur-md border-primary/20 shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={isContentInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
              >
                <Shield className="h-4 w-4 text-primary mr-2" />
                <span className="text-xs font-medium text-primary">
                  Proteção avançada
                </span>
              </motion.div>

              <motion.h2
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={isContentInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {t("landing.security.title")}
              </motion.h2>

              <motion.p
                className="text-lg text-muted-foreground mb-10 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={isContentInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {t("landing.security.description")}
              </motion.p>

              <motion.ul
                className="space-y-7"
                variants={containerVariants}
                initial="hidden"
                animate={isContentInView ? "visible" : "hidden"}
              >
                {securityFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-5 group"
                    variants={itemVariants}
                  >
                    <div
                      className={`rounded-xl ${feature.color} p-3 mt-0.5 border ${feature.borderColor} ${feature.hoverColor} transition-all duration-300`}
                    >
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-lg mb-2 group-hover:text-primary transition-colors duration-300">
                        {t(`landing.security.${feature.key}.title`)}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t(`landing.security.${feature.key}.description`)}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>

              {/* Badge de verificação de segurança melhorada */}
              <motion.div
                className="mt-12 bg-background/80 backdrop-blur-md border border-muted/60 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20"
                initial={{ opacity: 0, y: 20 }}
                animate={isContentInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shadow-inner">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">
                      Verificação de segurança
                    </span>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Todos os sistemas protegidos e atualizados
                  </span>
                </div>
                <div className="shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div ref={imageRef} className="flex-1" style={{ y: y2 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isImageInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.8,
                type: "spring",
                bounce: 0.2,
                delay: 0.1,
              }}
              className="relative rounded-xl overflow-hidden shadow-2xl border border-muted/30 group"
            >
              {/* Efeito de brilho decorativo aprimorado */}
              <div className="absolute -inset-3 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl"></div>

              <div className="relative bg-background/90 backdrop-blur-md p-1.5 rounded-xl overflow-hidden">
                {/* Cabeçalho decorativo do painel de segurança */}
                <div className="bg-muted/80 rounded-t-lg p-3.5 flex items-center justify-between border-b border-muted/60">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">
                      Painel de Segurança
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/30"></div>
                    <span className="text-xs text-muted-foreground">
                      Protegido
                    </span>
                  </div>
                </div>

                <div className="p-2">
                  <div className="rounded-lg overflow-hidden border border-muted/40 shadow-inner">
                    <img
                      src={securityPreview}
                      alt="Security Features"
                      className="w-full h-auto"
                      onError={(e) => {
                        e.currentTarget.classList.add(
                          "bg-muted",
                          "aspect-video"
                        );
                        e.currentTarget.src = placeholderImage;
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Indicadores de segurança animados melhorados */}
              <motion.div
                className="absolute top-1/4 right-5 rounded-full bg-green-500/20 border border-green-500/30 px-3.5 py-2 flex items-center gap-2 z-20 shadow-sm"
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={isImageInView ? { opacity: 1, scale: 1, x: 0 } : {}}
                transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
                whileHover={{
                  y: -2,
                  x: -2,
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/30"></div>
                <span className="text-xs font-medium text-green-600">
                  2FA Ativo
                </span>
              </motion.div>

              <motion.div
                className="absolute bottom-1/4 left-5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3.5 py-2 flex items-center gap-2 z-20 shadow-sm"
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={isImageInView ? { opacity: 1, scale: 1, x: 0 } : {}}
                transition={{ delay: 0.9, duration: 0.5, type: "spring" }}
                whileHover={{
                  y: -2,
                  x: 2,
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
              >
                <Lock className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">
                  Criptografado
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
