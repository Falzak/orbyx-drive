import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Shield, FileText, Share2, Smartphone } from "lucide-react";

const features = [
  {
    icon: <Shield className="h-10 w-10" />,
    key: "security",
    color: "from-blue-500/20 to-indigo-500/20",
    shadowColor: "shadow-blue-500/10",
  },
  {
    icon: <FileText className="h-10 w-10" />,
    key: "organization",
    color: "from-green-500/20 to-emerald-500/20",
    shadowColor: "shadow-green-500/10",
  },
  {
    icon: <Share2 className="h-10 w-10" />,
    key: "sharing",
    color: "from-purple-500/20 to-pink-500/20",
    shadowColor: "shadow-purple-500/10",
  },
  {
    icon: <Smartphone className="h-10 w-10" />,
    key: "anywhere",
    color: "from-amber-500/20 to-orange-500/20",
    shadowColor: "shadow-amber-500/10",
  },
];

export const Features = forwardRef<HTMLElement>((props, ref) => {
  const { t } = useTranslation();

  // Título com animação de digitação
  const titleText = t("landing.features.title");
  const titleVariants = {
    hidden: { opacity: 1 }, // Mantém a opacidade para evitar piscar
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      y: 15 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring", 
        damping: 12, 
        stiffness: 100,
      },
    },
  };

  return (
    <section
      ref={ref}
      id="features"
      className="py-20 md:py-28 bg-gradient-to-b from-background via-muted/30 to-background/80 relative overflow-hidden"
    >
      {/* Background decoration com transição suave */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] -top-[250px] -right-[100px] bg-primary/5 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute w-[500px] h-[500px] -bottom-[250px] -left-[100px] bg-secondary/5 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute w-[300px] h-[300px] top-1/2 left-1/3 bg-accent/5 rounded-full blur-3xl opacity-40"></div>
        
        {/* Linha decorativa sutil entre seções */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, once: true }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 mb-6 bg-background/50 backdrop-blur-md border-primary/20">
            <span className="text-xs font-medium text-primary">
              Funcionalidades
            </span>
          </div>

          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-6 tracking-tight"
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {titleText.split("").map((char, index) => (
              <motion.span
                key={index}
                className="inline-block"
                variants={letterVariants}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h2>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {t("landing.features.description")}
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`bg-background/80 backdrop-blur-md rounded-xl p-8 border border-muted shadow-lg hover:shadow-xl transition-all duration-300 ${feature.shadowColor}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1, 
                ease: "easeOut",
                once: true
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{
                y: -5,
                transition: { duration: 0.2, ease: "easeOut" },
              }}
            >
              <div
                className={`relative rounded-full h-16 w-16 flex items-center justify-center mb-6 text-primary bg-gradient-to-br ${feature.color}`}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-transparent opacity-60"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                    times: [0, 0.5, 1], // Tempos de transição suavizados
                    repeatDelay: 0.5,
                  }}
                />
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold mb-3">
                {t(`landing.features.${feature.key}.title`)}
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                {t(`landing.features.${feature.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
