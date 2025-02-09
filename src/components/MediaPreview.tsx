
import React from 'react';
import { Eye, File, Music, Video } from 'lucide-react';

interface MediaPreviewProps {
  contentType: string;
  url: string;
  filename: string;
}

const MediaPreview = ({ contentType, url, filename }: MediaPreviewProps) => {
  if (!contentType) return null;

  if (contentType.startsWith('image/')) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <img
          src={url}
          alt={filename}
          className="object-contain w-full h-full"
        />
      </div>
    );
  }

  if (contentType.startsWith('video/')) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <video
          src={url}
          controls
          className="w-full h-full"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (contentType.startsWith('audio/')) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-muted p-4">
        <div className="flex items-center gap-4">
          <Music className="h-8 w-8 text-primary" />
          <audio
            src={url}
            controls
            className="w-full"
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      </div>
    );
  }

  // Default preview for other file types
  return (
    <div className="relative rounded-lg overflow-hidden bg-muted p-8">
      <div className="flex flex-col items-center gap-4">
        <File className="h-12 w-12 text-primary" />
        <p className="text-sm text-muted-foreground text-center break-all">
          {filename}
        </p>
      </div>
    </div>
  );
};

export default MediaPreview;
