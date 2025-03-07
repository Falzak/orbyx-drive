import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle2, MousePointer, Grid, List, Search } from "lucide-react";

// Importando imagens
import filePreview from "/file-preview.svg";
import placeholderImage from "/placeholder.svg";

export const PreviewSection = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
      },
    },
  };

  const interfaceFeatures = [
    {
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      key: "customizable",
      color: "bg-blue-500/10",
    },
    {
      icon: <Grid className="h-4 w-4 text-primary" />,
      key: "previews",
      color: "bg-green-500/10",
    },
    {
      icon: <MousePointer className="h-4 w-4 text-primary" />,
      key: "oneClick",
      color: "bg-amber-500/10",
    },
  ];

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-background/80 via-background to-muted/30">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Superior connection with previous section */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-muted/20 to-transparent"></div>
        
        {/* Decorative blobs */}
        <div className="absolute h-96 w-96 -top-48 left-1/4 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute h-96 w-96 -right-48 bottom-0 bg-secondary/5 rounded-full blur-3xl"></div>
        
        {/* Bottom transition to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-muted/30"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative rounded-xl overflow-hidden shadow-2xl border border-muted/30 group"
            >
              {/* Decorative elements */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-xl blur-sm group-hover:opacity-100 opacity-70 transition-opacity duration-500"></div>
              <div className="absolute inset-[1px] bg-background rounded-xl z-10 flex items-center justify-center overflow-hidden">
                {/* Browser-like top bar */}
                <div className="absolute top-0 left-0 right-0 h-7 bg-muted/70 flex items-center px-4 z-20">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/60"></div>
                  </div>
                  <div className="mx-auto flex items-center px-3 py-0.5 bg-background/50 rounded-md text-xs text-muted-foreground">
                    <Search className="h-3 w-3 mr-1.5 text-muted-foreground/70" />
                    secure-file-safari.app
                  </div>
                </div>
                <img
                  src={filePreview}
                  alt="File Explorer Preview"
                  className="w-full h-auto mt-7"
                  onError={(e) => {
                    e.currentTarget.classList.add("bg-muted", "aspect-video");
                    e.currentTarget.src = placeholderImage;
                  }}
                />
              </div>

              {/* Interface controls highlighting */}
              <motion.div
                className="absolute top-16 right-8 z-20 bg-primary/10 rounded-full p-1 border border-primary/20"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
                viewport={{ once: true }}
              >
                <List className="h-4 w-4 text-primary" />
              </motion.div>

              <motion.div
                className="absolute top-16 right-16 z-20 bg-secondary/10 rounded-full p-1 border border-secondary/20"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
                viewport={{ once: true }}
              >
                <Grid className="h-4 w-4 text-secondary" />
              </motion.div>

              <motion.div
                className="absolute top-36 right-20 z-20 bg-background/90 backdrop-blur-sm shadow-lg rounded-lg px-2.5 py-1.5 text-xs border border-muted flex items-center gap-1.5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <MousePointer className="h-3 w-3 text-primary" />
                Visualização instantânea
              </motion.div>
            </motion.div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 mb-6 bg-background/50 backdrop-blur-md border-primary/20">
                <span className="text-xs font-medium text-primary">
                  Interface
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                {t("landing.interface.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t("landing.interface.description")}
              </p>

              <motion.ul
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {interfaceFeatures.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-4"
                    variants={itemVariants}
                  >
                    <div
                      className={`rounded-full ${feature.color} p-2.5 mt-0.5`}
                    >
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-lg mb-1">
                        {t(`landing.interface.${feature.key}.title`)}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {t(`landing.interface.${feature.key}.description`)}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
