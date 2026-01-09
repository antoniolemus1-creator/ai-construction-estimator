import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, password, fullName } = await req.json()
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    await supabaseAdmin.from('user_profiles').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role: 'super_admin',
    })

    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 10)

    await supabaseAdmin.from('subscriptions').insert({
      user_id: authData.user.id,
      tier: 'enterprise',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: endDate.toISOString(),
    })

    return new Response(JSON.stringify({ success: true, userId: authData.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
