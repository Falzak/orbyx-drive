import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";

// Importando imagens
import filePreview from "/file-preview.svg";
import placeholderImage from "/placeholder.svg";

export const PreviewSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="rounded-lg overflow-hidden shadow-xl border"
            >
              <img
                src={filePreview}
                alt="File Explorer Preview"
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.classList.add("bg-muted", "aspect-video");
                  e.currentTarget.src = placeholderImage;
                }}
              />
            </motion.div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t("landing.interface.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("landing.interface.description")}
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {t("landing.interface.customizable.title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.interface.customizable.description")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {t("landing.interface.previews.title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.interface.previews.description")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {t("landing.interface.oneClick.title")}
                    </h4>
                    <p className="text-muted-foreground">
                      {t("landing.interface.oneClick.description")}
                    </p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
