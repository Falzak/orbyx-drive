import React, { forwardRef, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Shield, FileText, Share2, Smartphone } from "lucide-react";

const features = [
  {
    icon: <Shield className="h-10 w-10" />,
    key: "security",
    color: "from-blue-500/30 to-indigo-500/30",
    shadowColor: "shadow-blue-500/20",
    iconBg: "bg-blue-500/10",
    borderColor: "group-hover:border-blue-500/50",
  },
  {
    icon: <FileText className="h-10 w-10" />,
    key: "organization",
    color: "from-green-500/30 to-emerald-500/30",
    shadowColor: "shadow-green-500/20",
    iconBg: "bg-green-500/10",
    borderColor: "group-hover:border-green-500/50",
  },
  {
    icon: <Share2 className="h-10 w-10" />,
    key: "sharing",
    color: "from-purple-500/30 to-pink-500/30",
    shadowColor: "shadow-purple-500/20",
    iconBg: "bg-purple-500/10",
    borderColor: "group-hover:border-purple-500/50",
  },
  {
    icon: <Smartphone className="h-10 w-10" />,
    key: "anywhere",
    color: "from-amber-500/30 to-orange-500/30",
    shadowColor: "shadow-amber-500/20",
    iconBg: "bg-amber-500/10",
    borderColor: "group-hover:border-amber-500/50",
  },
];

// Variantes de animação para o contêiner de recursos
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

// Variantes de animação para cada card de recurso
const featureVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
      duration: 0.4,
    },
  },
};

export const Features = forwardRef<HTMLElement>((props, ref) => {
  const { t } = useTranslation();
  const titleRef = useRef(null);
  const featuresRef = useRef(null);
  const isTitleInView = useInView(titleRef, { once: true, amount: 0.3 });
  const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.1 });

  // Título com animação de digitação
  const titleText = t("landing.features.title");
  const titleVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.025,
      },
    },
  };

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      filter: "blur(2px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 120,
      },
    },
  };

  return (
    <section
      ref={ref}
      id="features"
      className="py-24 md:py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden"
    >
      {/* Background decoration com efeitos melhorados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] -top-[300px] -right-[150px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-[120px] opacity-70"></div>
        <div className="absolute w-[600px] h-[600px] -bottom-[300px] -left-[150px] bg-gradient-to-tr from-secondary/5 to-primary/5 rounded-full blur-[120px] opacity-70"></div>
        <div className="absolute w-[400px] h-[400px] top-1/2 left-1/3 bg-gradient-to-r from-accent/5 to-secondary/5 rounded-full blur-[100px] opacity-60"></div>

        {/* Linha decorativa refinada entre seções */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={titleRef}
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center rounded-full border px-4 py-1.5 mb-8 bg-background/60 backdrop-blur-md border-primary/20 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={isTitleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3 }}
          >
            <span className="text-xs font-medium text-primary">
              Funcionalidades
            </span>
          </motion.div>

          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-8 tracking-tight"
            variants={titleVariants}
            initial="hidden"
            animate={isTitleInView ? "visible" : "hidden"}
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
            animate={isTitleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {t("landing.features.description")}
          </motion.p>
        </motion.div>

        <motion.div
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isFeaturesInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`group bg-background/80 backdrop-blur-md rounded-xl p-7 md:p-8 border border-muted/60 shadow-lg ${feature.shadowColor} hover:shadow-xl transition-all duration-500 hover:-translate-y-1`}
              variants={featureVariants}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
            >
              <div className="flex gap-6">
                <div
                  className={`relative h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-primary ${feature.iconBg} overflow-hidden group-hover:scale-110 transition-all duration-500`}
                >
                  {/* Gradient glow effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Animated circles */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{
                      background: [
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)",
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                      ],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Icon with subtle motion */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: "easeInOut",
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                    {t(`landing.features.${feature.key}.title`)}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    {t(`landing.features.${feature.key}.description`)}
                  </p>
                </div>
              </div>

              {/* Bottom border animation */}
              <motion.div
                className={`h-[2px] w-0 bg-gradient-to-r ${feature.color} absolute bottom-0 left-0 right-0 ${feature.borderColor} opacity-0 group-hover:opacity-100 group-hover:w-full transition-all duration-500`}
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});
