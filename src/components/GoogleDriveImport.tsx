
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { File, Import, HardDrive, Trash2, Download, Loader2 } from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  thumbnailLink?: string;
}

const GoogleDriveImport = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFiles(files);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFiles(
        files.filter((file) => file.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, files]);

  const handleApiRequest = async (endpoint: string, options = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No authenticated session");
      }
      
      const response = await fetch(`/api/google-drive/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        ...options
      });
      
      // First check if the response is OK
      if (!response.ok) {
        let errorMessage = `Server responded with status: ${response.status}`;
        const contentType = response.headers.get('content-type');
        
        // Check if response is JSON
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          if (text) {
            errorMessage = `Server error: ${text}`;
          }
        }
        throw new Error(errorMessage);
      }
      
      // Now safely parse JSON
      const text = await response.text();
      if (!text) {
        return {}; // Empty response
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

  const checkConnection = async () => {
    if (!open) return;
    
    setError(null);
    try {
      setIsLoading(true);
      
      const data = await handleApiRequest('list-files');
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setIsConnected(true);
      setFiles(data.files || []);
      setFilteredFiles(data.files || []);
    } catch (error) {
      console.error("Google Drive connection check failed:", error);
      setIsConnected(false);
      setError(error.message || t("googleDrive.connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  const connectToGoogleDrive = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const redirectUri = `${window.location.origin}/dashboard`;
      const data = await handleApiRequest(`auth-url?redirectUri=${encodeURIComponent(redirectUri)}`);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Store state in localStorage to verify when returning
      localStorage.setItem("googleDriveAuthState", data.state);
      
      // Redirect to Google OAuth
      window.location.href = data.url;
    } catch (error) {
      console.error("Google Drive connection failed:", error);
      setError(error.message || t("googleDrive.connectionError"));
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || t("googleDrive.connectionError"),
      });
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = localStorage.getItem("googleDriveAuthState");
    
    // Clean URL by removing OAuth parameters
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    // Clear state from localStorage
    localStorage.removeItem("googleDriveAuthState");
    
    if (!code || !state || state !== storedState) {
      console.error("Invalid OAuth callback");
      return;
    }
    
    try {
      const redirectUri = `${window.location.origin}/dashboard`;
      
      const data = await handleApiRequest(`callback?code=${code}&redirectUri=${encodeURIComponent(redirectUri)}`);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: t("googleDrive.connectionSuccess"),
        description: t("googleDrive.connectionSuccessDescription"),
      });
      
      setOpen(true);
      checkConnection();
    } catch (error) {
      console.error("Google Drive callback error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || t("googleDrive.callbackError"),
      });
    }
  };

  useEffect(() => {
    // Check if we're returning from Google OAuth
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    if (code && state) {
      handleOAuthCallback();
    }
  }, []);

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const importFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("googleDrive.noFilesSelected"),
      });
      return;
    }
    
    setIsImporting(true);
    setError(null);
    
    const successCount = {current: 0};
    const failedFiles = [];
    
    for (const fileId of selectedFiles) {
      try {
        const file = files.find(f => f.id === fileId);
        
        if (!file) continue;
        
        const data = await handleApiRequest("import-file", {
          method: "POST",
          body: JSON.stringify({
            fileId: file.id,
            fileName: file.name,
          }),
        });
        
        if (data.error) {
          failedFiles.push(`${file.name}: ${data.error}`);
          console.error(`Error importing ${file.name}:`, data.error);
        } else {
          successCount.current++;
        }
      } catch (error) {
        console.error(`Error importing file ${fileId}:`, error);
        const file = files.find(f => f.id === fileId);
        if (file) failedFiles.push(`${file.name}: ${error.message || 'Unknown error'}`);
      }
    }
    
    // Refresh the file list
    queryClient.invalidateQueries({ queryKey: ["files"] });
    
    // Show toast message
    if (successCount.current > 0) {
      toast({
        title: t("googleDrive.importSuccess"),
        description: t("googleDrive.importSuccessDescription", { count: successCount.current }),
      });
    }
    
    if (failedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: t("googleDrive.importPartialFailure"),
        description: t("googleDrive.importFailureDescription", { files: failedFiles.join(", ") }),
      });
    }
    
    setSelectedFiles([]);
    setIsImporting(false);
    setOpen(false);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.startsWith("application/pdf")) return "📄";
    if (mimeType.startsWith("application/msword") || mimeType.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) return "📝";
    if (mimeType === "application/vnd.google-apps.document") return "📄";
    if (mimeType === "application/vnd.google-apps.spreadsheet") return "📊";
    if (mimeType === "application/vnd.google-apps.presentation") return "📊";
    return "📁";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex gap-2 items-center"
          onClick={() => {
            if (!isConnected) {
              connectToGoogleDrive();
            }
          }}
        >
          <HardDrive className="h-4 w-4" />
          <span>{t("googleDrive.importButton")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[80vw] md:min-w-[600px] max-w-[80vw] md:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t("googleDrive.importTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("googleDrive.importDescription")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center py-10">
            <HardDrive className="h-16 w-16 mb-4 text-primary/50" />
            <h3 className="text-lg font-medium mb-2">{t("googleDrive.notConnected")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("googleDrive.connectDescription")}</p>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <p><strong>{t("common.error")}:</strong> {error}</p>
              </div>
            )}
            <Button onClick={connectToGoogleDrive} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Import className="h-4 w-4 mr-2" />
              )}
              {t("googleDrive.connectButton")}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Input
                type="search"
                placeholder={t("googleDrive.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <p><strong>{t("common.error")}:</strong> {error}</p>
              </div>
            )}
            
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <File className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-center text-muted-foreground">
                  {searchQuery ? t("googleDrive.noSearchResults") : t("googleDrive.noFiles")}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center space-x-2 p-2 rounded-md border ${
                        selectedFiles.includes(file.id)
                          ? "bg-primary/5 border-primary/20"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Checkbox
                        id={`file-${file.id}`}
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={() => handleFileSelect(file.id)}
                      />
                      <Label
                        htmlFor={`file-${file.id}`}
                        className="flex-1 flex items-center space-x-2 cursor-pointer"
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          <span className="text-xl">{getFileIcon(file.mimeType)}</span>
                        </div>
                        <div className="flex-1 truncate">
                          <p className="truncate font-medium">{file.name}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span className="truncate">
                              {formatFileSize(parseInt(file.size) || 0)}
                            </span>
                            <span className="mx-1">•</span>
                            <span className="truncate">
                              {new Date(file.modifiedTime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                {selectedFiles.length > 0
                  ? t("googleDrive.selectedFilesCount", { count: selectedFiles.length })
                  : t("googleDrive.noFilesSelected")}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={importFiles}
                  disabled={isImporting || selectedFiles.length === 0}
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {t("googleDrive.importButton")}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GoogleDriveImport;
