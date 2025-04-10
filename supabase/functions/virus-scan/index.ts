
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const VIRUS_TOTAL_API_KEY = Deno.env.get('VIRUS_TOTAL_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileUrl, userId, fileId } = await req.json()
    
    if (!fileUrl) {
      throw new Error('File URL is required')
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('Starting virus scan for file:', fileUrl)

    // First, get URL analysis if it exists
    const getAnalysisResponse = await fetch(
      `https://www.virustotal.com/api/v3/urls/${encodeURIComponent(btoa(fileUrl))}/analyses`, 
      {
        headers: {
          'x-apikey': VIRUS_TOTAL_API_KEY
        }
      }
    )
    
    // If URL analysis exists, use it
    if (getAnalysisResponse.ok) {
      const analysisData = await getAnalysisResponse.json()
      return handleScanResult(analysisData, userId, fileId, supabase)
    }

    // Submit URL for scanning
    console.log('Submitting URL for scanning:', fileUrl)
    const formData = new FormData()
    formData.append('url', fileUrl)
    
    const scanResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': VIRUS_TOTAL_API_KEY
      },
      body: formData
    })

    if (!scanResponse.ok) {
      const errorText = await scanResponse.text()
      console.error('Error scanning URL:', errorText)
      throw new Error(`VirusTotal API error: ${scanResponse.status} ${scanResponse.statusText}`)
    }

    const scanData = await scanResponse.json()
    const analysisId = scanData.data.id
    
    // Poll for analysis results
    let analysisResult = null
    let retries = 5
    
    while (retries > 0) {
      console.log(`Polling for analysis results (${retries} retries left)`)
      const analysisResponse = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
          headers: {
            'x-apikey': VIRUS_TOTAL_API_KEY
          }
        }
      )
      
      if (!analysisResponse.ok) {
        retries--
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      
      analysisResult = await analysisResponse.json()
      if (analysisResult.data.attributes.status === 'completed') {
        return handleScanResult(analysisResult, userId, fileId, supabase)
      }
      
      retries--
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // If we got here, the scan didn't complete in time
    return new Response(
      JSON.stringify({ 
        safe: null, 
        status: 'timeout',
        message: 'Scan is taking longer than expected. File will be available after scan completes.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in virus scan function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleScanResult(analysisResult, userId, fileId, supabase) {
  // Process the analysis results
  const attributes = analysisResult.data.attributes
  const stats = attributes.stats
  const isSafe = stats.malicious === 0 && stats.suspicious <= 1
  
  // Log scan results in database
  if (userId && fileId) {
    try {
      await supabase.from('virus_scan_results').insert({
        file_id: fileId,
        user_id: userId,
        is_safe: isSafe,
        scan_date: new Date().toISOString(),
        scan_results: analysisResult.data
      })
    } catch (dbError) {
      console.error('Error saving scan results to database:', dbError)
    }
  }
  
  return new Response(
    JSON.stringify({
      safe: isSafe,
      status: 'completed',
      stats: {
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        undetected: stats.undetected
      },
      message: isSafe ? 'File is safe to download' : 'Potential security risk detected in file'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
