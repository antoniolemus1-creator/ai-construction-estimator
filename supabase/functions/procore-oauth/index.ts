import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PROCORE_CLIENT_ID = Deno.env.get('PROCORE_CLIENT_ID') || 'demo_client_id'
const PROCORE_CLIENT_SECRET = Deno.env.get('PROCORE_CLIENT_SECRET') || 'demo_secret'
const PROCORE_REDIRECT_URI = Deno.env.get('PROCORE_REDIRECT_URI') || 'http://localhost:5173/procore/callback'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, code, userId } = await req.json()

    if (action === 'get_auth_url') {
      const authUrl = `https://login.procore.com/oauth/authorize?` +
        `client_id=${PROCORE_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(PROCORE_REDIRECT_URI)}`

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'exchange_code') {
      // Exchange code for access token
      const tokenResponse = await fetch('https://login.procore.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: PROCORE_CLIENT_ID,
          client_secret: PROCORE_CLIENT_SECRET,
          code,
          redirect_uri: PROCORE_REDIRECT_URI,
        }),
      })

      const tokens = await tokenResponse.json()

      // Store tokens in database
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase.from('procore_connections').upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })

      return new Response(JSON.stringify({ success: true }), {
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
