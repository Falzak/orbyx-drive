
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordSubmit: (password: string) => void;
  title?: string;
  description?: string;
}

export function PasswordPrompt({
  isOpen,
  onClose,
  onPasswordSubmit,
  title,
  description
}: PasswordPromptProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError(t("password.required"));
      return;
    }
    
    setError(null);
    onPasswordSubmit(password);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setPassword("");
      setError(null);
      onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {title || t("password.title")}
          </DialogTitle>
          <DialogDescription>
            {description || t("password.description")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("password.placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="bg-muted rounded-md p-3">
            <p className="text-sm text-muted-foreground">
              {t("password.securityNote")}
            </p>
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {t("password.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
