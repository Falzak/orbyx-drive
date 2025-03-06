import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";

// Importando imagens
import securityPreview from "/security-preview.svg";
import placeholderImage from "/placeholder.svg";

export const SecuritySection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t("landing.security.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("landing.security.description")}
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {t("landing.security.twoFactor.title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.security.twoFactor.description")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {t("landing.security.encryption.title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.security.encryption.description")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {t("landing.security.links.title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.security.links.description")}
                    </p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="rounded-lg overflow-hidden shadow-xl border"
            >
              <img
                src={securityPreview}
                alt="Security Features"
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.classList.add("bg-muted", "aspect-video");
                  e.currentTarget.src = placeholderImage;
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
