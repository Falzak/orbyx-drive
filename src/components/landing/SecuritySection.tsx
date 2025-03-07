import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Lock, Shield, Key, Fingerprint } from "lucide-react";

// Importando imagens
import securityPreview from "/security-preview.svg";
import placeholderImage from "/placeholder.svg";

export const SecuritySection = () => {
  const { t } = useTranslation();

  // Animações para a lista de recursos de segurança
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
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
      },
    },
  };

  const securityFeatures = [
    {
      icon: <Lock className="h-4 w-4 text-primary" />,
      key: "twoFactor",
      color: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      icon: <Key className="h-4 w-4 text-primary" />,
      key: "encryption",
      color: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      icon: <Shield className="h-4 w-4 text-primary" />,
      key: "links",
      color: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-muted/30 via-muted/40 to-background/80 relative overflow-hidden">
      {/* Background decorations com transições suaves */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Transição com a seção anterior */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-muted/30 to-muted/40"></div>
        
        {/* Transição com a próxima seção */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-muted/40 to-background/80"></div>
        
        {/* Efeito decorativo sutil na parte central */}
        <div className="absolute left-0 right-0 top-1/3 bottom-1/3 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-80"></div>
      </div>

      {/* Animated security symbols in background */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        {Array.from({ length: 8 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute text-primary"
            initial={{
              opacity: 0.3,
              y: -20,
              scale: 0.8,
              x: Math.random() * 100 - 50,
            }}
            animate={{
              opacity: [0.2, 0.3, 0.2],
              y: ["10%", "70%"],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
              delay: index * 2,
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
        <div className="flex flex-col lg:flex-row items-center gap-14">
          <div className="flex-1 max-w-lg">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 mb-6 bg-background/50 backdrop-blur-md border-primary/20">
                <Shield className="h-3.5 w-3.5 text-primary mr-2" />
                <span className="text-xs font-medium text-primary">
                  Proteção avançada
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                {t("landing.security.title")}
              </h2>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t("landing.security.description")}
              </p>

              <motion.ul
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {securityFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-4"
                    variants={itemVariants}
                    whileHover={{ x: 5 }}
                  >
                    <div
                      className={`rounded-full ${feature.color} p-2.5 mt-0.5 border ${feature.borderColor}`}
                    >
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-lg mb-1">
                        {t(`landing.security.${feature.key}.title`)}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t(`landing.security.${feature.key}.description`)}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>

              {/* Verificação de segurança */}
              <motion.div
                className="mt-10 bg-background/70 backdrop-blur-md border rounded-lg p-4 inline-flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    Verificação de segurança
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Todos os sistemas protegidos
                  </span>
                </div>
                <div className="ml-auto h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </motion.div>
            </motion.div>
          </div>

          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 50 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative rounded-xl overflow-hidden shadow-2xl border border-muted/30 group"
            >
              {/* Decorative glowing effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 via-background/0 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>

              <div className="relative bg-background/80 backdrop-blur-md p-1 rounded-xl overflow-hidden">
                {/* Security panel decorative header */}
                <div className="bg-muted/70 rounded-t-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">
                      Painel de segurança
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-muted-foreground">Ativo</span>
                  </div>
                </div>

                <div className="p-2">
                  <img
                    src={securityPreview}
                    alt="Security Features"
                    className="w-full h-auto rounded-md"
                    onError={(e) => {
                      e.currentTarget.classList.add("bg-muted", "aspect-video");
                      e.currentTarget.src = placeholderImage;
                    }}
                  />
                </div>
              </div>

              {/* Animated security indicators */}
              <motion.div
                className="absolute top-1/4 right-6 rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1.5 flex items-center gap-2 z-20"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-green-500">
                  2FA Ativo
                </span>
              </motion.div>

              <motion.div
                className="absolute bottom-1/4 left-6 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 flex items-center gap-2 z-20"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <span className="text-xs font-medium">
                  Criptografia de ponta a ponta
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
