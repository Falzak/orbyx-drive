import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Componente de formas decorativas para o fundo
const DecorativeShapes = () => {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          initial={{ 
            scale: 0.6, 
            opacity: 0.3,
            x: -10, 
            y: -10
          }}
          animate={{ 
            scale: [0.7, 0.85, 0.7], 
            opacity: [0.2, 0.4, 0.2],
            x: Math.random() * 20 - 10,
            y: Math.random() * 20 - 10,
          }}
          transition={{
            duration: 5 + Math.random() * 7,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: index * 0.5
          }}
          style={{
            width: 20 + Math.random() * 40,
            height: 20 + Math.random() * 40,
            left: `${10 + Math.random() * 80}%`,
            top: `${Math.random() * 80}%`,
            background: `rgba(var(--${index % 2 ? 'primary' : 'secondary'}-rgb) / 0.15)`,
          }}
        />
      ))}
    </>
  );
};

export const CTASection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-muted/10 via-background/80 to-background">
      {/* Transição suave da seção anterior */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-muted/10 to-transparent pointer-events-none"></div>
      
      {/* Gradiente de fundo mais chamativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/10 to-secondary/5"></div>
      
      {/* Formas decorativas animadas */}
      <div className="absolute inset-0 overflow-hidden opacity-50 pointer-events-none">
        <DecorativeShapes />
        
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto bg-background/70 backdrop-blur-lg rounded-2xl p-8 md:p-14 border border-muted/40 shadow-xl">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div 
              className="inline-flex items-center justify-center mb-5"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="rounded-full bg-primary/10 p-4 relative">
                <ShieldCheck className="h-8 w-8 text-primary relative z-10" />
                <motion.div 
                  className="absolute inset-0 rounded-full bg-primary/5"
                  animate={{ 
                    scale: [1, 1.4, 1], 
                    opacity: [0.7, 0, 0.7] 
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              {t("landing.cta.title")}
            </h2>

            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-1 w-12 rounded-full bg-primary/30"></div>
              <Sparkles className="h-5 w-5 text-primary/70" />
              <div className="h-1 w-12 rounded-full bg-primary/30"></div>
            </div>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("landing.cta.description")}
            </p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              viewport={{ once: true }}
            >
              <Link to="/auth?signup=true">
                <Button 
                  size="lg" 
                  className="px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-primary to-primary/90"
                >
                  {t("landing.cta.createAccount")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-6 text-base rounded-full border-primary/20 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
                >
                  {t("landing.cta.login")}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Recursos principais em um formato de badges */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-4 mt-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            viewport={{ once: true }}
          >
            {["Segurança", "Organização", "Compartilhamento", "Acessibilidade"].map((feature, index) => (
              <div 
                key={index} 
                className="bg-background/50 backdrop-blur-sm px-4 py-1.5 rounded-full border text-sm text-muted-foreground"
              >
                {feature}
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Mensagem de incentivo abaixo do CTA principal */}
        <motion.p 
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          viewport={{ once: true }}
        >
          Comece gratuitamente. Sem necessidade de cartão de crédito.
        </motion.p>
      </div>
    </section>
  );
};
