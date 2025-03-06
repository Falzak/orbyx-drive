import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Importando imagens
import placeholderImage from "/placeholder.svg";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Gerente de Projetos",
    content:
      "O Secure File Safari revolucionou a forma como gerenciamos documentos sensíveis em nossa empresa. A interface é intuitiva e a segurança é incomparável.",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    name: "Carlos Mendes",
    role: "Advogado",
    content:
      "Como profissional que lida com documentos confidenciais, encontrei no Secure File Safari a tranquilidade que precisava. A autenticação de dois fatores com lembrete de dispositivo é essencial.",
    avatar: "https://i.pravatar.cc/150?img=67",
  },
  {
    name: "Ana Costa",
    role: "Designer",
    content:
      "A organização por cores e categorias facilita muito encontrar meus arquivos de design. A visualização em grade é perfeita para identificar rapidamente o que preciso.",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
];

export const TestimonialsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("landing.testimonials.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-xl p-6 border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                  onError={(e) => {
                    e.currentTarget.src = placeholderImage;
                  }}
                />
                <div>
                  <h4 className="font-medium">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className="italic text-muted-foreground">
                &ldquo;{testimonial.content}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
