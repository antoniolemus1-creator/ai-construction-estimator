import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { action, planId, imageUrl, pageNumber, existingSchema } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OpenAI API key not configured');

    if (action === 'analyze_schema_needs') {
      // First pass: Analyze what data exists in the image
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [{
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: `Analyze this construction plan and identify ALL data types present that could be extracted. Include standard items (walls, doors, windows) AND any specialized data like:
- MEP components (electrical panels, outlets, HVAC units, plumbing fixtures)
- Structural elements (beams, columns, foundations, rebar)
- Finishes (flooring types, paint specs, tile patterns)
- Equipment (appliances, fixtures, special equipment)
- Site work (grading, landscaping, utilities)
- Custom annotations or specifications

Return JSON with structure:
{
  "standard_elements": {...},
  "mep_elements": {...},
  "structural_elements": {...},
  "custom_elements": {...},
  "suggested_tables": [
    {
      "table_name": "string",
      "columns": [{"name": "string", "type": "string", "description": "string"}],
      "purpose": "string"
    }
  ]
}`
              },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }],
          max_tokens: 3000
        })
      });

      const analysisData = await analysisResponse.json();
      const analysis = JSON.parse(analysisData.choices?.[0]?.message?.content || '{}');

      return new Response(JSON.stringify({ success: true, analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create_dynamic_tables') {
      const { tables } = await req.json();
      
      // Create dynamic tables based on AI recommendations
      const createdTables = [];
      for (const table of tables) {
        const tableName = `ai_extracted_${table.table_name}_${user.id.slice(0, 8)}`;
        
        // Build CREATE TABLE SQL
        const columns = [
          'id UUID DEFAULT gen_random_uuid() PRIMARY KEY',
          'plan_id UUID REFERENCES plans(id)',

          'user_id UUID REFERENCES auth.users(id)',
          'page_number INTEGER',
          'extracted_at TIMESTAMPTZ DEFAULT NOW()',
          ...table.columns.map((col: any) => 
            `${col.name} ${col.type}${col.required ? ' NOT NULL' : ''}`
          )
        ];

        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS ${tableName} (
            ${columns.join(',\n            ')}
          );
          
          ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "${tableName}_policy" ON ${tableName}
            FOR ALL USING (user_id = auth.uid());
        `;

        const { error } = await supabaseClient.rpc('exec_sql', { 
          sql: createTableSQL 
        });

        if (!error) {
          createdTables.push({
            name: tableName,
            original_name: table.table_name,
            columns: table.columns
          });

          // Store metadata about AI-created table
          await supabaseClient.from('ai_created_schemas').insert({
            user_id: user.id,
            plan_id: planId,
            table_name: tableName,
            schema_definition: table,
            created_at: new Date().toISOString()
          });
        }
      }

      return new Response(JSON.stringify({ success: true, createdTables }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'extract_to_dynamic_schema') {
      const { targetTable, imageUrl, pageNumber } = await req.json();
      
      // Extract data into the dynamically created table
      const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [{
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: `Extract ALL data for table: ${targetTable.original_name}
Columns needed: ${JSON.stringify(targetTable.columns)}
Return as JSON array of objects matching the column structure.`
              },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }],
          max_tokens: 4000
        })
      });

      const extractData = await extractResponse.json();
      const extracted = JSON.parse(extractData.choices?.[0]?.message?.content || '[]');

      // Insert into dynamic table
      if (extracted.length > 0) {
        const items = extracted.map((item: any) => ({
          ...item,
          plan_id: planId,
          user_id: user.id,
          page_number: pageNumber
        }));

        const { error } = await supabaseClient
          .from(targetTable.name)
          .insert(items);

        if (error) throw error;
      }

      return new Response(JSON.stringify({ 
        success: true, 
        itemsExtracted: extracted.length,
        table: targetTable.name 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});