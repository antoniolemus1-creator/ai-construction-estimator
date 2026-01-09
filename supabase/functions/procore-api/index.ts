import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PROCORE_API_BASE = 'https://api.procore.com/rest/v1.0'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, userId, accessToken, companyId, projectId, data } = await req.json()

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Procore-Company-Id': companyId,
    }

    if (action === 'get_projects') {
      const response = await fetch(`${PROCORE_API_BASE}/companies/${companyId}/projects`, {
        headers,
      })
      const projects = await response.json()
      return new Response(JSON.stringify({ projects }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create_budget_line_item') {
      const response = await fetch(
        `${PROCORE_API_BASE}/projects/${projectId}/budget_line_items`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }
      )
      const result = await response.json()
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'upload_photo') {
      const response = await fetch(
        `${PROCORE_API_BASE}/projects/${projectId}/images`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }
      )
      const result = await response.json()
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
