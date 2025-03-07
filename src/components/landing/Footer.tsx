import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ExternalLink, Shield, Github, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { key: "features", href: "#features" },
      { key: "pricing", href: "#pricing" },
      { key: "security", href: "#security" },
    ],
    company: [
      { key: "about", href: "#about" },
      { key: "blog", href: "#blog" },
      { key: "contact", href: "#contact" },
    ],
    legal: [
      { key: "privacy", href: "#privacy" },
      { key: "terms", href: "#terms" },
    ],
  };

  const socialLinks = [
    {
      icon: <Github className="h-4 w-4" />,
      href: "https://github.com",
      label: "GitHub",
    },
    {
      icon: <Twitter className="h-4 w-4" />,
      href: "https://twitter.com",
      label: "Twitter",
    },
    {
      icon: <Instagram className="h-4 w-4" />,
      href: "https://instagram.com",
      label: "Instagram",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <footer className="py-16 bg-gradient-to-t from-muted/50 to-background border-t relative overflow-hidden">
      {/* Transição suave da seção anterior */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent pointer-events-none"></div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-12">
          {/* Logo e tagline */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4"
            >
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Secure File Safari</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-sm text-muted-foreground max-w-xs mb-4"
            >
              {t("landing.footer.tagline")}
            </motion.p>

            {/* Social links */}
            <motion.div
              className="flex gap-3 mt-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {socialLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  variants={childVariants}
                  className="bg-background/80 backdrop-blur-sm p-2 rounded-full border border-muted/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-110 shadow-sm"
                >
                  {link.icon}
                </motion.a>
              ))}
            </motion.div>
          </div>

          {/* Links da navegação */}
          <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-3 gap-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h4 variants={childVariants} className="font-medium mb-4">
                {t("landing.footer.product")}
              </motion.h4>
              <motion.ul variants={containerVariants} className="space-y-2">
                {footerLinks.product.map((link, index) => (
                  <motion.li key={index} variants={childVariants}>
                    <Link to={link.href}>
                      <Button
                        variant="link"
                        className="p-0 h-auto hover:text-primary transition-colors"
                      >
                        {t(`landing.footer.${link.key}`)}
                      </Button>
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h4 variants={childVariants} className="font-medium mb-4">
                {t("landing.footer.company")}
              </motion.h4>
              <motion.ul variants={containerVariants} className="space-y-2">
                {footerLinks.company.map((link, index) => (
                  <motion.li key={index} variants={childVariants}>
                    <Link to={link.href}>
                      <Button
                        variant="link"
                        className="p-0 h-auto hover:text-primary transition-colors"
                      >
                        {t(`landing.footer.${link.key}`)}
                      </Button>
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h4 variants={childVariants} className="font-medium mb-4">
                {t("landing.footer.legal")}
              </motion.h4>
              <motion.ul variants={containerVariants} className="space-y-2">
                {footerLinks.legal.map((link, index) => (
                  <motion.li key={index} variants={childVariants}>
                    <Link to={link.href}>
                      <Button
                        variant="link"
                        className="p-0 h-auto hover:text-primary transition-colors"
                      >
                        {t(`landing.footer.${link.key}`)}
                      </Button>
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>

        <div className="pt-6 border-t border-muted/30 flex flex-col md:flex-row justify-between items-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: true }}
            className="text-sm text-muted-foreground mb-4 md:mb-0"
          >
            &copy; {currentYear} Secure File Safari.{" "}
            {t("landing.footer.copyright")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span>Feito com</span>
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-background/70 border">
              <Shield className="h-3 w-3 mr-1.5 text-primary" />
              <span>Secure File Safari</span>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};
