import React, { forwardRef, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Shield, FileText, Share2, Smartphone } from "lucide-react";

// Simplified feature definitions
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

  // Simplified title animation with smoother transitions
  const titleText = t("landing.features.title");
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeOut", // Simpler easing function to prevent flickering
      },
    },
  };

  return (
    <section
      ref={ref}
      id="features"
      className="py-24 md:py-32 bg-gradient-to-b from-background via-background/98 to-background/90 relative overflow-hidden"
    >
      {/* Transição suave da seção anterior */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent pointer-events-none"></div>

      {/* Transição suave para a próxima seção */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background/90 pointer-events-none"></div>

      {/* Subtle monochromatic background elements - fixed opacity values */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] -top-[400px] -right-[200px] bg-primary/5 rounded-full blur-[150px] opacity-30"></div>
        <div className="absolute w-[600px] h-[600px] -bottom-[300px] -left-[150px] bg-primary/5 rounded-full blur-[120px] opacity-20"></div>

        {/* Minimal decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div ref={titleRef} className="text-center max-w-3xl mx-auto mb-20">
          {/* Modern minimal badge */}
          <div className="inline-flex items-center rounded-full px-4 py-1.5 mb-8 border border-primary/10 bg-primary/5">
            <span className="text-xs font-medium text-primary/80">
              {t("landing.features.badge")}
            </span>
          </div>

          {/* Clean, modern heading */}
          <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight">
            {titleText}
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.features.description")}
          </p>
        </div>

        <div
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-background border border-primary/10 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-500 ease-out hover:-translate-y-1"
            >
              <div className="flex gap-6">
                {/* Modern monochromatic icon container */}
                <div
                  className={`relative h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-primary bg-primary/5 overflow-hidden transition-all duration-500`}
                >
                  {/* Subtle glow effect - smoother transition */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 bg-primary/10 rounded-xl"></div>

                  {/* Static icon with hover effect to eliminate animation flickering */}
                  <div className="text-primary opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                    {feature.icon}
                  </div>
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

              {/* Subtle bottom border animation - smoother transition */}
              <div className="h-[1px] w-0 bg-primary/20 absolute bottom-0 left-0 opacity-0 group-hover:opacity-100 group-hover:w-full transition-all duration-700 ease-in-out"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
