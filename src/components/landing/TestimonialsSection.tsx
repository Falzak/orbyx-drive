import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Star, Quote } from "lucide-react";

// Importando imagens
import placeholderImage from "/placeholder.svg";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Gerente de Projetos",
    content:
      "O Orbyx Drive revolucionou a forma como gerenciamos documentos sensíveis em nossa empresa. A interface é intuitiva e a segurança é incomparável.",
    avatar: "https://i.pravatar.cc/150?img=32",
    rating: 5,
  },
  {
    name: "Carlos Mendes",
    role: "Advogado",
    content:
      "Como profissional que lida com documentos confidenciais, encontrei no Orbyx Drive a tranquilidade que precisava. A autenticação de dois fatores com lembrete de dispositivo é essencial.",
    avatar: "https://i.pravatar.cc/150?img=67",
    rating: 5,
  },
  {
    name: "Ana Costa",
    role: "Designer",
    content:
      "A organização por cores e categorias facilita muito encontrar meus arquivos de design. A visualização em grade é perfeita para identificar rapidamente o que preciso.",
    avatar: "https://i.pravatar.cc/150?img=47",
    rating: 4,
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

export const TestimonialsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-background/80 via-background to-muted/10">
      {/* Background elements with transition from previous section */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Transição suave da seção anterior */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/80 to-transparent"></div>

        {/* Decorative blobs posicionados estrategicamente */}
        <div className="absolute top-10 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-10 -right-6 w-32 h-32 bg-secondary/10 rounded-full blur-3xl opacity-60"></div>

        {/* Transição para a próxima seção */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-muted/10"></div>

        {/* Decorative quotes */}
        <motion.div
          className="absolute top-20 left-10 text-muted/5"
          animate={{
            rotate: [0, 10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 10,
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
          }}
          transition={{
            duration: 12,
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
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 mr-2" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-background/80 backdrop-blur-md rounded-xl p-6 border shadow-md hover:shadow-xl transition-all duration-300 relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -5 }}
            >
              {/* Gradiente sutíl no topo do card */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/40 via-primary/20 to-secondary/30 rounded-t-lg"></div>

              {/* Ícone de citação */}
              <div className="absolute -top-3 -left-3 bg-background rounded-full p-1.5 border shadow-sm">
                <Quote className="h-4 w-4 text-primary" />
              </div>

              <div className="mb-6 mt-2">
                <StarRating rating={testimonial.rating} />
              </div>

              <p className="italic text-muted-foreground mb-6 relative">
                <span className="text-primary/80 text-xl leading-none absolute -top-1 -left-1">
                  "
                </span>
                {testimonial.content}
                <span className="text-primary/80 text-xl leading-none absolute -bottom-4">
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
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selo de confiança */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 bg-background/50 backdrop-blur-md border rounded-xl p-4 max-w-2xl mx-auto"
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
        </motion.div>
      </div>
    </section>
  );
};
