
-- Store Google Drive tokens securely
CREATE TABLE IF NOT EXISTS public.google_drive_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure only the owner can access their tokens
ALTER TABLE public.google_drive_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own tokens
CREATE POLICY "Users can view their own tokens" 
  ON public.google_drive_tokens
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Only allow users to insert their own tokens  
CREATE POLICY "Users can insert their own tokens" 
  ON public.google_drive_tokens
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own tokens
CREATE POLICY "Users can update their own tokens" 
  ON public.google_drive_tokens
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add source field to files table to track file origin
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS original_id TEXT;
