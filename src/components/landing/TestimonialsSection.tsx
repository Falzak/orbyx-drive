import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Star, Quote, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

// Importando imagens
import placeholderImage from "/placeholder.svg";

// Array de depoimentos expandido
const testimonials = [
  {
    name: "Maria Silva",
    role: "Gerente de Projetos",
    content:
      "O Orbyx Drive revolucionou a forma como gerenciamos documentos sensíveis em nossa empresa. A interface é intuitiva e a segurança é incomparável.",
    avatar: "https://i.pravatar.cc/150?img=32",
    rating: 5,
    company: "TechSolutions",
    highlight: true,
  },
  {
    name: "Carlos Mendes",
    role: "Advogado",
    content:
      "Como profissional que lida com documentos confidenciais, encontrei no Orbyx Drive a tranquilidade que precisava. A autenticação de dois fatores com lembrete de dispositivo é essencial.",
    avatar: "https://i.pravatar.cc/150?img=67",
    rating: 5,
    company: "Mendes & Associados",
    highlight: false,
  },
  {
    name: "Ana Costa",
    role: "Designer",
    content:
      "A organização por cores e categorias facilita muito encontrar meus arquivos de design. A visualização em grade é perfeita para identificar rapidamente o que preciso.",
    avatar: "https://i.pravatar.cc/150?img=47",
    rating: 4,
    company: "Creative Studios",
    highlight: false,
  },
  {
    name: "João Oliveira",
    role: "Diretor Financeiro",
    content:
      "A capacidade de controlar quem acessa cada documento e por quanto tempo é fundamental para nossa equipe financeira. O Orbyx Drive nos dá exatamente isso.",
    avatar: "https://i.pravatar.cc/150?img=15",
    rating: 5,
    company: "Finança Global",
    highlight: true,
  },
  {
    name: "Camila Torres",
    role: "Médica",
    content:
      "A segurança e confidencialidade são essenciais na área da saúde. Com o Orbyx Drive, tenho certeza que os dados dos pacientes estão protegidos com a mais alta tecnologia.",
    avatar: "https://i.pravatar.cc/150?img=24",
    rating: 5,
    company: "Hospital Central",
    highlight: false,
  },
];

// Componente para exibir uma classificação de estrelas
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
};

// Componente para o card de depoimento
const TestimonialCard = ({
  testimonial,
  index,
  isActive = false,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
  isActive?: boolean;
}) => {
  return (
    <motion.div
      className={cn(
        "bg-background/80 backdrop-blur-md rounded-xl p-6 border shadow-md transition-all duration-500 relative group cursor-grab active:cursor-grabbing h-full",
        isActive
          ? "border-primary/30 shadow-xl"
          : "hover:shadow-xl hover:border-primary/20",
        testimonial.highlight ? "border-l-4 border-l-primary" : ""
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-100px" }}
      whileHover={{ y: -5 }}
    >
      {/* Gradiente no topo do card */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/40 via-primary/20 to-secondary/30 rounded-t-lg"></div>

      {/* Ícone de citação */}
      <div className="absolute -top-3 -left-3 bg-background rounded-full p-1.5 border shadow-sm">
        <Quote className="h-4 w-4 text-primary" />
      </div>

      <div className="mb-6 mt-2 flex justify-between items-center">
        <StarRating rating={testimonial.rating} />
        <motion.div
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {testimonial.company}
        </motion.div>
      </div>

      <p className="italic text-muted-foreground mb-6 relative">
        <span className="text-primary/80 text-2xl leading-none absolute -top-1 -left-1">
          "
        </span>
        {testimonial.content}
        <span className="text-primary/80 text-2xl leading-none absolute -bottom-4 right-0">
          "
        </span>
      </p>

      <div className="flex items-center pt-4 border-t border-muted">
        <div className="relative">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full mr-4 border-2 border-background shadow-sm"
            onError={(e) => {
              e.currentTarget.src = placeholderImage;
            }}
          />
          <motion.div
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 -z-10 opacity-0 group-hover:opacity-100"
            initial={{ scale: 0.8 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
          />
        </div>
        <div>
          <h4 className="font-medium">{testimonial.name}</h4>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const TestimonialsSection = () => {
  const { t } = useTranslation();
  const [api, setApi] = React.useState<any>(null);
  const [current, setCurrent] = React.useState(0);
  const [showDots, setShowDots] = React.useState(true);

  // Plugin de autoplay com pausa ao passar o mouse
  const autoplayPlugin = React.useMemo(
    () =>
      Autoplay({
        delay: 5000,
        stopOnInteraction: true,
        rootNode: (emblaRoot) => emblaRoot.parentElement,
      }),
    []
  );

  // Atualiza o slide atual quando o carrossel muda
  const onSelect = React.useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  React.useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  // Detecta o tamanho da tela para exibir os pontos apenas em telas maiores
  React.useEffect(() => {
    const checkSize = () => {
      setShowDots(window.innerWidth > 768);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => {
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-background/80 via-background/90 to-background/80">
      {/* Background elements with transition from previous section */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Transição suave da seção anterior */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/80 to-transparent"></div>

        {/* Elementos decorativos dinâmicos */}
        <motion.div
          className="absolute top-10 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-60"
          animate={{
            x: [0, 20, 0],
            y: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute bottom-10 -right-6 w-32 h-32 bg-secondary/10 rounded-full blur-3xl opacity-60"
          animate={{
            x: [0, -20, 0],
            y: [0, -15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Transição para a próxima seção */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background/80"></div>

        {/* Elementos decorativos de aspas flutuantes */}
        <motion.div
          className="absolute top-20 left-10 text-muted/5"
          animate={{
            rotate: [0, 10, 0],
            scale: [1, 1.05, 1],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Quote size={120} />
        </motion.div>

        <motion.div
          className="absolute bottom-20 right-10 text-muted/5"
          animate={{
            rotate: [0, -10, 0],
            scale: [1, 1.05, 1],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <Quote size={100} />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 mb-6 bg-background/50 backdrop-blur-md border-primary/20">
            <Users className="h-3.5 w-3.5 text-primary mr-2" />
            <span className="text-xs font-medium text-primary">
              Clientes satisfeitos
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            {t("landing.testimonials.title")}
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("landing.testimonials.description")}
          </p>
        </motion.div>

        {/* Carrossel de depoimentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
          className="relative pb-14"
        >
          <Carousel
            setApi={setApi}
            plugins={[autoplayPlugin]}
            className="mx-auto w-full max-w-5xl"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="py-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={index}
                  className="md:basis-1/2 lg:basis-1/3 h-full"
                >
                  <TestimonialCard
                    testimonial={testimonial}
                    index={index}
                    isActive={current === index}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="absolute -left-8 md:-left-12 top-1/2 -translate-y-1/2 z-10">
              <CarouselPrevious
                variant="ghost"
                className="bg-background/50 backdrop-blur-sm border border-border h-10 w-10 opacity-80 hover:opacity-100"
              />
            </div>

            <div className="absolute -right-8 md:-right-12 top-1/2 -translate-y-1/2 z-10">
              <CarouselNext
                variant="ghost"
                className="bg-background/50 backdrop-blur-sm border border-border h-10 w-10 opacity-80 hover:opacity-100"
              />
            </div>
          </Carousel>

          {/* Indicadores de slides */}
          {showDots && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    current === index
                      ? "w-8 bg-primary"
                      : "w-2 bg-primary/20 hover:bg-primary/40"
                  }`}
                  onClick={() => api?.scrollTo(index)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Selo de confiança */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 bg-background/50 backdrop-blur-md border rounded-xl p-6 max-w-2xl mx-auto relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="rounded-full bg-primary/10 p-3">
            <Star className="h-6 w-6 text-primary fill-primary" />
          </div>
          <div className="text-center sm:text-left">
            <h4 className="font-medium text-lg">4.9/5 classificação média</h4>
            <p className="text-sm text-muted-foreground">
              Baseado em mais de 500 avaliações de clientes
            </p>
          </div>

          {/* Animação de estrelas */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: Math.random() * 100 - 50,
                y: Math.random() * 60 - 30,
                scale: 0.5,
                opacity: 0,
              }}
              animate={{
                x: Math.random() * 200 - 100,
                y: Math.random() * 80 - 40,
                opacity: [0.1, 0.3, 0.1],
                scale: [0.5, 0.7, 0.5],
              }}
              transition={{
                duration: 5 + Math.random() * 8,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.5,
              }}
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                zIndex: -1,
              }}
            >
              <Star className="h-3 w-3 text-primary fill-primary/30" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
