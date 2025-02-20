import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/50">
      <div className="w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          {/* Número 404 Animado */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="relative"
          >
            <h1 className="text-8xl font-black text-primary/10">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-16 w-16 text-primary/50" />
            </div>
          </motion.div>

          {/* Mensagem de Erro */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {t("error.404.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("error.404.description")}
            </p>
          </div>

          {/* Caminho que causou o erro */}
          <div className="bg-muted/50 rounded-lg p-2 font-mono text-sm">
            <code className="text-muted-foreground">{location.pathname}</code>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              variant="default"
              className="gap-2"
              onClick={handleGoHome}
            >
              <Home className="h-4 w-4" />
              {t("suggestions.404.second")}
            </Button>
          </div>

          {/* Sugestões */}
          <div className="text-sm text-muted-foreground">
            {t("error.suggestions")}
            <ul className="mt-2 space-y-1">
              <li>{t("suggestions.404.first")}</li>
              {t("suggestions.404.third")}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
