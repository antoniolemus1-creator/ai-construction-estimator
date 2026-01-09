import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== OpenAI API Test Started ===')
    
    // Check if API key exists
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OPENAI_API_KEY not configured in Supabase',
          step: 'environment_check'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('✅ OpenAI API key found:', openaiKey.substring(0, 10) + '...')
    
    // Test API call with simple prompt
    console.log('🔄 Making test API call to OpenAI...')
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ 
          role: 'user', 
          content: 'Respond with: API test successful' 
        }],
        max_tokens: 20
      }),
    })

    console.log('📡 OpenAI Response Status:', openaiResponse.status)
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', errorText)
      
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
      } catch {
        errorDetails = { message: errorText }
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorDetails,
          status: openaiResponse.status,
          step: 'api_call'
        }),
        { status: openaiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    const responseText = openaiData.choices[0].message.content
    
    console.log('✅ OpenAI Response:', responseText)
    console.log('=== Test Complete ===')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OpenAI API is working correctly',
        response: responseText,
        model: openaiData.model,
        usage: openaiData.usage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('=== Test Failed ===')
    console.error(error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        step: 'unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
