import React from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="py-12 bg-muted/30 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between mb-8">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Secure File Safari</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("landing.footer.tagline")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-medium mb-4">
                {t("landing.footer.product")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto">
                    {t("landing.footer.features")}
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto">
                    {t("landing.footer.pricing")}
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto">
                    {t("landing.footer.security")}
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">
                {t("landing.footer.company")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto">
                    {t("landing.footer.about")}
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto">
                    {t("landing.footer.blog")}
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto">
                    {t("landing.footer.contact")}
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">{t("landing.footer.legal")}</h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto">
                    {t("landing.footer.privacy")}
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto">
                    {t("landing.footer.terms")}
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-muted flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Secure File Safari.{" "}
            {t("landing.footer.copyright")}
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};
