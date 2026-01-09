import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, searchTerm, state, county, itemId } = await req.json();
    const apiKey = Deno.env.get('ONEBUILD_API_KEY');

    if (!apiKey) {
      throw new Error('ONEBUILD_API_KEY not configured');
    }

    // Log the request
    await supabaseClient.from('onebuild_api_logs').insert({
      action,
      request_data: { searchTerm, state, county, itemId }
    });

    if (action === 'search') {
      // Check cache first
      const cacheKey = `${searchTerm}_${state || 'all'}_${county || 'all'}`;
      const { data: cached } = await supabaseClient
        .from('onebuild_pricing_cache')
        .select('*')
        .eq('search_term', searchTerm)
        .eq('state', state || null)
        .eq('county', county || null)
        .gte('cached_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (cached) {
        await supabaseClient.from('onebuild_api_logs').insert({
          action: 'cache_hit',
          request_data: { searchTerm, state, county },
          response_data: { cached: true }
        });
        return new Response(JSON.stringify({ results: cached.results, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Call 1Build API
      const url = new URL('https://api.1build.com/v1/materials/search');
      url.searchParams.append('q', searchTerm);
      if (state) url.searchParams.append('state', state);
      if (county) url.searchParams.append('county', county);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      const data = await response.json();

      // Cache results
      await supabaseClient.from('onebuild_pricing_cache').insert({
        search_term: searchTerm,
        state: state || null,
        county: county || null,
        results: data.results || []
      });

      // Log response
      await supabaseClient.from('onebuild_api_logs').insert({
        action: 'search_complete',
        request_data: { searchTerm, state, county },
        response_data: { count: data.results?.length || 0 }
      });

      return new Response(JSON.stringify({ results: data.results || [], cached: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'getDetails') {
      const response = await fetch(`https://api.1build.com/v1/materials/${itemId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();

      await supabaseClient.from('onebuild_api_logs').insert({
        action: 'get_details',
        request_data: { itemId },
        response_data: data
      });

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'clearCache') {
      await supabaseClient.from('onebuild_pricing_cache').delete().lt('cached_at', new Date().toISOString());
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
