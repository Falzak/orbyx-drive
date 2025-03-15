
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || ''
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || ''

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Handle different endpoints
    switch (path) {
      case 'auth-url':
        return handleAuthUrl(req)
      case 'callback':
        return handleCallback(req, user.id)
      case 'list-files':
        return handleListFiles(req, user.id)
      case 'import-file':
        return handleImportFile(req, user.id)
      default:
        throw new Error('Unknown endpoint')
    }
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleAuthUrl(req: Request) {
  const redirectUri = new URL(req.url).searchParams.get('redirectUri') || ''
  
  if (!redirectUri) {
    throw new Error('Missing redirectUri parameter')
  }

  // Generate random state for security
  const state = crypto.randomUUID()
  
  // Build OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/drive.readonly')
  authUrl.searchParams.append('access_type', 'offline')
  authUrl.searchParams.append('state', state)
  authUrl.searchParams.append('prompt', 'consent')
  
  return new Response(
    JSON.stringify({ url: authUrl.toString(), state }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCallback(req: Request, userId: string) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const redirectUri = url.searchParams.get('redirectUri')
  
  if (!code || !redirectUri) {
    throw new Error('Missing code or redirectUri parameter')
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenResponse.json()
  
  if (!tokenResponse.ok) {
    throw new Error(`Failed to exchange code: ${tokenData.error}`)
  }

  // Store tokens in database
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Check if record exists
  const { data: existing } = await supabase
    .from('google_drive_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (existing) {
    // Update existing record
    await supabase
      .from('google_drive_tokens')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || existing.refresh_token, // Keep old refresh token if not provided
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      })
      .eq('user_id', userId)
  } else {
    // Insert new record
    await supabase
      .from('google_drive_tokens')
      .insert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      })
  }
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getValidAccessToken(userId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Get tokens from database
  const { data: tokens, error } = await supabase
    .from('google_drive_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error || !tokens) {
    throw new Error('No Google Drive connection found')
  }
  
  // Check if token is expired
  if (new Date(tokens.expires_at) <= new Date()) {
    // Refresh token
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    
    const refreshData = await refreshResponse.json()
    
    if (!refreshResponse.ok) {
      throw new Error(`Failed to refresh token: ${refreshData.error}`)
    }
    
    // Update token in database
    await supabase
      .from('google_drive_tokens')
      .update({
        access_token: refreshData.access_token,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      })
      .eq('user_id', userId)
    
    return refreshData.access_token
  }
  
  return tokens.access_token
}

async function handleListFiles(req: Request, userId: string) {
  try {
    const accessToken = await getValidAccessToken(userId)
    
    // Fetch files from Google Drive
    const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,size,modifiedTime,thumbnailLink)&q=trashed=false', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Google Drive API error: ${error.error?.message || 'Unknown error'}`)
    }
    
    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleImportFile(req: Request, userId: string) {
  try {
    const { fileId, fileName } = await req.json()
    
    if (!fileId || !fileName) {
      throw new Error('Missing fileId or fileName')
    }
    
    const accessToken = await getValidAccessToken(userId)
    
    // Download file from Google Drive
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }
    
    // Get file metadata to determine content type
    const metaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,size`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!metaResponse.ok) {
      throw new Error(`Failed to get file metadata: ${metaResponse.statusText}`)
    }
    
    const metadata = await metaResponse.json()
    const fileContent = await response.arrayBuffer()
    
    // Generate a unique file path
    const fileExt = fileName.split('.').pop() || ''
    const filePath = `${crypto.randomUUID()}.${fileExt}`
    
    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    const { error: uploadError } = await supabase
      .storage
      .from('files')
      .upload(filePath, fileContent, {
        contentType: metadata.mimeType,
        cacheControl: '3600',
      })
    
    if (uploadError) {
      throw new Error(`Failed to upload to storage: ${uploadError.message}`)
    }
    
    // Add file record to database
    const { error: dbError } = await supabase
      .from('files')
      .insert({
        filename: fileName,
        file_path: filePath,
        content_type: metadata.mimeType,
        size: metadata.size,
        user_id: userId,
        source: 'google_drive',
        original_id: fileId,
      })
      
    if (dbError) {
      // Rollback storage upload on DB error
      await supabase.storage.from('files').remove([filePath])
      throw new Error(`Failed to add file record: ${dbError.message}`)
    }
    
    return new Response(
      JSON.stringify({ success: true, filePath }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}
