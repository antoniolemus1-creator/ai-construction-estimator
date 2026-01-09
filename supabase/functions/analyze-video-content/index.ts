import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Exponential backoff retry logic
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (i === maxRetries - 1) throw error
      if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
        const delay = Math.min(1000 * Math.pow(2, i) + Math.random() * 1000, 60000)
        console.log(`Rate limit hit, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { videoId, videoTitle, videoDescription, userId, thumbnailUrl, forceReanalyze } = await req.json()
    console.log('=== Video Analysis Started ===')
    console.log('Video ID:', videoId)
    console.log('Force Reanalyze:', forceReanalyze)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check cache first unless force reanalyze
    if (!forceReanalyze) {
      const { data: cached } = await supabase
        .from('video_analysis_cache')
        .select('*')
        .eq('video_id', videoId)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (cached) {
        console.log('Cache hit! Returning cached analysis')
        
        // Update cache hits and last accessed
        await supabase
          .from('video_analysis_cache')
          .update({ 
            cache_hits: cached.cache_hits + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', cached.id)

        // Update user cache statistics
        await supabase.rpc('increment_cache_stats', {
          p_user_id: userId,
          p_tokens_saved: cached.tokens_used,
          p_cost_saved: cached.estimated_cost
        })

        return new Response(
          JSON.stringify({
            success: true,
            fromCache: true,
            cacheHits: cached.cache_hits + 1,
            tokensSaved: cached.tokens_used,
            costSaved: cached.estimated_cost,
            analysis: cached.analysis_result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Perform new analysis
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OpenAI API key not configured')

    const analysisPrompt = `Analyze this construction/drywall training video:

Title: ${videoTitle}
Description: ${videoDescription || 'No description'}

Provide JSON with: summary, difficultyLevel, estimatedDuration, keyConcepts (name, confidence, description), materialsMentioned, techniquesDescribed, bestPractices, suggestedQuestions`

    const openaiCall = async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI error: ${errorText}`)
      }
      return response.json()
    }

    const openaiData = await retryWithBackoff(openaiCall)
    const analysisResults = JSON.parse(openaiData.choices[0].message.content)
    const tokensUsed = openaiData.usage?.total_tokens || 0
    const estimatedCost = (tokensUsed / 1000) * 0.0015 // gpt-4o-mini pricing

    // Store in cache
    await supabase.from('video_analysis_cache').upsert({
      video_id: videoId,
      video_url: thumbnailUrl,
      analysis_result: analysisResults,
      tokens_used: tokensUsed,
      estimated_cost: estimatedCost,
      analyzed_by: userId,
    })

    // Store in analyzed_videos
    await supabase.from('analyzed_videos').upsert({
      user_id: userId,
      video_id: videoId,
      video_title: videoTitle,
      thumbnail_url: thumbnailUrl,
      analysis_results: analysisResults,
      concepts_count: analysisResults.keyConcepts?.length || 0,
    }, { onConflict: 'user_id,video_id' })

    return new Response(
      JSON.stringify({
        success: true,
        fromCache: false,
        tokensUsed,
        estimatedCost,
        analysis: analysisResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
