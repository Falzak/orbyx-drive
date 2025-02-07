
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Lock, Clock, Eye, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface FileWithPreview extends File {
  preview?: string;
}

const Index = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
    
    toast({
      title: "Files added successfully",
      description: `${acceptedFiles.length} files ready for upload`,
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Secure File Sharing
          </motion.h1>
          <motion.p 
            className="text-muted-foreground text-lg mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Share files with end-to-end encryption and complete privacy
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <motion.div 
            className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div 
              {...getRootProps()} 
              className={`
                p-8 border-2 border-dashed rounded-lg 
                transition-colors duration-200 ease-in-out
                ${isDragActive ? 'border-mint-500 bg-mint-50/10' : 'border-border'}
                hover:border-mint-500 hover:bg-mint-50/5
                cursor-pointer
              `}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg mb-2">
                  {isDragActive ? 
                    "Drop the files here..." : 
                    "Drag & drop files here, or click to select"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Supported files: Images, PDF, Word documents
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Lock className="h-8 w-8 text-mint-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-sm text-muted-foreground">Your files are encrypted before upload</p>
            </div>
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Clock className="h-8 w-8 text-mint-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Expiring Links</h3>
              <p className="text-sm text-muted-foreground">Set automatic file deletion</p>
            </div>
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Eye className="h-8 w-8 text-mint-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tracking</h3>
              <p className="text-sm text-muted-foreground">Your privacy is our priority</p>
            </div>
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
              <Shield className="h-8 w-8 text-mint-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Password Protection</h3>
              <p className="text-sm text-muted-foreground">Secure access control</p>
            </div>
          </motion.div>
        </div>

        {files.length > 0 && (
          <motion.div 
            className="rounded-lg bg-card/50 backdrop-blur-sm border border-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl font-semibold mb-4">Selected Files</h2>
            <div className="space-y-4">
              {files.map((file) => (
                <div 
                  key={file.name} 
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded bg-mint-100 flex items-center justify-center">
                      <span className="text-mint-700 text-xs">{file.name.split('.').pop()?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Index;
