import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Shield, FileText, Share2, Smartphone } from "lucide-react";

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

export const Features = forwardRef<HTMLElement>((props, ref) => {
  const { t } = useTranslation();

  return (
    <section ref={ref} id="features" className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.features.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-xl p-8 border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mb-4 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t(`landing.features.${feature.key}.title`)}
              </h3>
              <p className="text-muted-foreground">
                {t(`landing.features.${feature.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
