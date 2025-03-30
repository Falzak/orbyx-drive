
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VIRUS_TOTAL_API_KEY = Deno.env.get('VIRUS_TOTAL_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

serve(async (req) => {
  // Lidar com solicitações CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileId } = await req.json();
    
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'URL do arquivo é obrigatória' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Iniciando verificação de arquivo: ${fileUrl}`);
    
    // Enviar URL para análise do Virus Total
    const vtResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': VIRUS_TOTAL_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `url=${encodeURIComponent(fileUrl)}`
    });

    if (!vtResponse.ok) {
      const errorData = await vtResponse.json();
      console.error('Erro na API do Virus Total:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar arquivo para análise' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const analysisData = await vtResponse.json();
    const analysisId = analysisData.data.id;
    
    // Aguardar um pouco para dar tempo à análise
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Obter resultado da análise
    const resultResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
      method: 'GET',
      headers: {
        'x-apikey': VIRUS_TOTAL_API_KEY
      }
    });
    
    if (!resultResponse.ok) {
      console.error('Erro ao obter resultado da análise');
      return new Response(
        JSON.stringify({ error: 'Erro ao obter resultado da análise' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const resultData = await resultResponse.json();
    
    console.log('Resultado da análise:', JSON.stringify(resultData, null, 2));
    
    // Verificar se há ameaças detectadas
    const stats = resultData.data.attributes.stats;
    const isThreat = stats.malicious > 0 || stats.suspicious > 0;
    
    // Se fileId foi fornecido, atualizar o registro do arquivo no banco de dados
    if (fileId && isThreat) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      await supabase
        .from('files')
        .update({ 
          is_malware: true,
          security_scan_result: resultData.data.attributes
        })
        .eq('id', fileId);
      
      console.log(`Arquivo marcado como malware: ${fileId}`);
    }
    
    return new Response(
      JSON.stringify({
        id: analysisId,
        result: resultData.data.attributes,
        isThreat,
        stats: resultData.data.attributes.stats
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Erro na função de verificação de vírus:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
