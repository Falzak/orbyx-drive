
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle } from "lucide-react";

export const SessionsList = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["user-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .order("last_active_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const terminateSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast({
        title: t("settings.sessions.terminateSuccess"),
        description: t("settings.sessions.terminateDescription"),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          {t("settings.sections.sessions.title")}
        </CardTitle>
        <CardDescription>
          {t("settings.sections.sessions.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.sessions.device")}</TableHead>
              <TableHead>{t("settings.sessions.location")}</TableHead>
              <TableHead>{t("settings.sessions.lastActive")}</TableHead>
              <TableHead>{t("settings.sessions.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions?.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{session.device_info}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.user_agent}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {session.location || t("settings.sessions.locationUnknown")}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(session.last_active_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession.mutate(session.id)}
                    disabled={terminateSession.isPending}
                  >
                    {t("settings.sessions.terminate")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
