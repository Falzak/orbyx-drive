import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Importando imagens
import dashboardPreview from "/dashboard-preview.svg";
import placeholderImage from "/placeholder.svg";

interface HeroProps {
  scrollToFeatures: () => void;
}

export const Hero: React.FC<HeroProps> = ({ scrollToFeatures }) => {
  const { t } = useTranslation();

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-background via-background to-background/80 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-accent/20 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                {t("landing.hero.title")
                  .split(" seguro")
                  .map((part, i) =>
                    i === 0 ? (
                      <React.Fragment key={i}>
                        {part}
                        <span className="text-primary"> seguro</span>
                      </React.Fragment>
                    ) : (
                      part
                    )
                  )}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                {t("landing.hero.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/auth?signup=true">
                  <Button size="lg" className="w-full sm:w-auto">
                    {t("landing.hero.startNow")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={scrollToFeatures}
                >
                  {t("landing.hero.seeFeatures")}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Criptografia de ponta a ponta</span>
                <CheckCircle2 className="h-4 w-4 text-primary ml-4" />
                <span>Autenticação de dois fatores</span>
                <CheckCircle2 className="h-4 w-4 text-primary ml-4" />
                <span>Sem limite de arquivos</span>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 w-full max-w-xl">
            <motion.div
              className="relative rounded-lg border overflow-hidden shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-full relative aspect-[16/9] bg-gradient-to-br from-background to-muted rounded-lg overflow-hidden">
                <img
                  src={dashboardPreview}
                  alt="Dashboard Preview"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.classList.add(
                      "bg-muted",
                      "flex",
                      "items-center",
                      "justify-center"
                    );
                    e.currentTarget.src = placeholderImage;
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
