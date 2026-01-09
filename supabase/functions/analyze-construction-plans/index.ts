import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: any, status = 200) => 
  new Response(JSON.stringify(data), { 
    status, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });

const parseJsonSafe = (text: string) => {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { planId, action, prompt, extractedData, hasVisionData, imageUrl, pageNumber, settings, analysisConfig } = await req.json();

    const authHeader = req.headers.get('Authorization') || '';
    
    console.log('=== AUTH DIAGNOSTICS ===');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header format valid:', authHeader.startsWith('Bearer '));
    console.log('Request method:', req.method);
    console.log('Action:', action);
    
    if (!authHeader) {
      console.error('❌ No authorization header');
      return json({ 
        error: 'Not authenticated', 
        error_code: 'missing_auth_header',
        hint: 'Use supabase.functions.invoke() from frontend'
      }, 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Invalid auth format');
      return json({ 
        error: 'Invalid authorization format', 
        error_code: 'invalid_auth_format'
      }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Auth failed:', userError?.message);
      return json({ 
        error: 'Authentication failed', 
        error_code: 'auth_failed', 
        details: userError?.message
      }, 401);
    }

    console.log('✅ Authenticated user:', user.id);

    // AI Chat action
    if (!action && prompt) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) throw new Error('OpenAI API key not configured');

      let dataContext = '';
      let systemMessage = 'You are a construction estimator.';
      
      if (hasVisionData && extractedData?.length > 0) {
        const summary = {
          totalItems: extractedData.length,
          walls: extractedData.filter((i: any) => i.item_type === 'wall'),
          ceilings: extractedData.filter((i: any) => i.item_type === 'ceiling'),
          doors: extractedData.filter((i: any) => i.item_type === 'door'),
          windows: extractedData.filter((i: any) => i.item_type === 'window')
        };
        
        dataContext = `EXTRACTED DATA: ${summary.totalItems} items - Walls: ${summary.walls.length}, Ceilings: ${summary.ceilings.length}, Doors: ${summary.doors.length}, Windows: ${summary.windows.length}`;
        systemMessage = `You are a construction estimator AI analyzing visual data from plans.`;
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemMessage + '\n\n' + dataContext },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000
        })
      });
      
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('OpenAI error:', res.status, body.slice(0, 200));
        return json({ error_code: 'openai_http_error', status: res.status }, 502);
      }
      
      const payload = await res.json();
      const aiResponse = payload.choices?.[0]?.message?.content || 'Could not process request.';

      await supabaseClient.from('plan_conversations').insert([
        { plan_id: planId, user_id: user.id, role: 'user', message: prompt },
        { plan_id: planId, user_id: user.id, role: 'assistant', message: aiResponse }
      ]);

      return json({ success: true, response: aiResponse });
    }

    if (action === 'extract_ocr_text') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) throw new Error('OpenAI API key not configured');

      console.log('OCR extraction - Plan:', planId, 'Page:', pageNumber, 'User:', user.id);
      
      // Verify plan ownership
      const { data: planCheck, error: planError } = await supabaseClient
        .from('plans')
        .select('id, user_id')
        .eq('id', planId)
        .single();
      
      if (planError || !planCheck || planCheck.user_id !== user.id) {
        return json({ error: 'Plan not found or unauthorized' }, 403);
      }
      
      // Use GPT-4 Vision for OCR text extraction
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all text from this construction specification document. Preserve formatting, section numbers, and hierarchy. Return the complete text.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }],
          max_tokens: 4000
        })
      });
      
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('OpenAI OCR error:', res.status, body.slice(0, 200));
        return json({ error_code: 'openai_ocr_error', status: res.status }, 502);
      }
      
      const payload = await res.json();
      const extractedText = payload.choices?.[0]?.message?.content ?? '';
      
      // Store OCR text
      const { data: ocrData, error: ocrError } = await supabaseClient
        .from('ocr_extracted_text')
        .insert({
          plan_id: planId,
          page_number: pageNumber || 1,
          extracted_text: extractedText,
          user_id: user.id
        })
        .select('id')
        .single();
      
      if (ocrError) {
        console.error('OCR storage error:', ocrError);
        return json({ error: 'Failed to store OCR text' }, 500);
      }
      
      return json({ 
        success: true, 
        ocrTextId: ocrData.id,
        extractedText,
        message: 'OCR extraction complete'
      });
    }

    if (action === 'extract_with_vision') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) throw new Error('OpenAI API key not configured');

      console.log('Vision extraction - Plan:', planId, 'Page:', pageNumber, 'User:', user.id);
      
      // Verify plan ownership BEFORE calling OpenAI
      const { data: planCheck, error: planError } = await supabaseClient
        .from('plans')
        .select('id, user_id')
        .eq('id', planId)
        .single();
      
      if (planError || !planCheck) {
        console.error('❌ Plan not found:', planError?.message);
        return json({ 
          error: 'Plan not found', 
          error_code: 'plan_not_found',
          details: planError?.message 
        }, 404);
      }
      
      if (planCheck.user_id !== user.id) {
        console.error('❌ Plan ownership mismatch');
        return json({ 
          error: 'Not authorized to access this plan', 
          error_code: 'plan_unauthorized' 
        }, 403);
      }
      
      console.log('✅ Plan ownership verified');
      
      let extractionPrompt = '';
      if (analysisConfig?.specDivisions?.length > 0) {
        extractionPrompt = `Analyze this construction specification document image. Focus on divisions: ${analysisConfig.specDivisions.join(', ')}. Extract specifications you can see. Return JSON: {"specifications": [{"division": "string", "section": "string", "item": "string", "specification": "string", "quantity": "string", "standards": [], "notes": "string"}]}`;
      } else {
        extractionPrompt = `You are performing a detailed wall takeoff from this construction floor plan.

CRITICAL INSTRUCTIONS:
1. WALL TYPE IDENTIFICATION:
   - Look for wall type legends, partition schedules, or wall type keys on the drawing
   - Identify wall type codes/designations (e.g., "A", "B", "WP-1", "INT-1", "EXT-1", "DEMO")
   - For each wall type, note any visible specifications (stud size, layers, fire rating)
   - If wall types are shown in a legend, extract ALL the information from that legend

2. LINEAR FOOTAGE MEASUREMENT:
   - Measure EACH wall segment individually
   - Group walls by their wall type code
   - Use the scale bar or noted scale to calculate actual lengths
   - ${analysisConfig?.drawingScale ? `Drawing scale: ${analysisConfig.drawingScale}` : 'If no scale is provided, estimate based on typical room dimensions (bedrooms ~12ft, bathrooms ~8ft, hallways ~4ft wide)'}

3. WALL PROPERTIES TO EXTRACT:
   - Wall type code/designation
   - Linear footage
   - Wall composition if shown (e.g., "5/8 GWB ea. side, 3-5/8 metal studs @ 16 o.c.")
   - Fire rating if noted
   - STC rating if noted
   - Location/room

4. ITEMS THAT REQUIRE USER CLARIFICATION (add to clarifications array):
   - Deck/ceiling height (if not shown on plans)
   - Metal stud gauge (if not specified)
   - Drywall type (regular, Type X, moisture resistant, abuse resistant)
   - Drywall finish level (Level 0-5)
   - Paint type and sheen
   - Insulation requirements

${analysisConfig?.takeoffItems?.length > 0 ? `Also extract these specific items: ${analysisConfig.takeoffItems.join(', ')}` : ''}

IMPORTANT: For each item, provide approximate pixel coordinates (x, y) relative to the image dimensions (assume 1000x1000 canvas). This allows highlighting items on the drawing.

Return JSON with this structure:
{
  "wall_types_legend": [
    {
      "type_code": "string (e.g., 'A', 'WP-1')",
      "description": "string (full description from legend)",
      "composition": "string (materials/layers)",
      "stud_size": "string (e.g., '3-5/8\"', '6\"')",
      "stud_spacing": "string (e.g., '16\" o.c.')",
      "fire_rating": "string or null",
      "stc_rating": "number or null",
      "layers_each_side": "number",
      "drywall_type": "string or null"
    }
  ],
  "walls": [
    {
      "wall_type_code": "string",
      "length_ft": "number",
      "room_name": "string",
      "from_to": "string (e.g., 'Grid A to Grid B')",
      "notes": "string",
      "confidence": "number 0-100",
      "coordinates": {"start_x": "number 0-1000", "start_y": "number 0-1000", "end_x": "number 0-1000", "end_y": "number 0-1000"}
    }
  ],
  "wall_type_totals": [
    {
      "type_code": "string",
      "total_linear_ft": "number",
      "wall_count": "number"
    }
  ],
  "clarifications_needed": [
    {
      "question_type": "string (deck_height|stud_gauge|drywall_type|finish_level|paint_type|insulation|other)",
      "question": "string",
      "context": "string (why this is needed)",
      "affects_wall_types": ["array of wall type codes this affects"]
    }
  ],
  "ceilings": [{"area_sqft": "number", "room_name": "string", "ceiling_type": "string", "confidence": "number", "coordinates": {"x": "number", "y": "number", "width": "number", "height": "number"}}],
  "doors": [{"count": "number", "room_name": "string", "type": "string", "size": "string", "coordinates": {"x": "number 0-1000", "y": "number 0-1000"}}],
  "windows": [{"count": "number", "room_name": "string", "type": "string", "size": "string", "coordinates": {"x": "number 0-1000", "y": "number 0-1000"}}],
  "drawing_info": {
    "sheet_number": "string",
    "scale": "string",
    "title": "string"
  }
}`;
      }

      console.log('Image URL length:', imageUrl?.length);
      console.log('Image URL prefix:', imageUrl?.substring(0, 30));

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an expert commercial drywall estimator with 20+ years of experience reading construction documents. You specialize in:
- Reading partition schedules and wall type legends
- Performing accurate linear footage takeoffs
- Understanding metal stud framing (gauges, spacing, heights)
- Drywall layering and fire-rated assemblies
- Identifying what information is missing and needs clarification from the GC or architect

When analyzing drawings:
1. ALWAYS look for wall type legends/partition schedules first - these define the assembly for each wall type code
2. Measure each wall segment and group by wall type code
3. Calculate totals per wall type for material ordering
4. Flag any missing information that affects material quantities (deck height, stud gauge, drywall type, finish level, paint)

Be thorough and precise. Construction estimating errors cost real money. Always respond with valid JSON.`
            },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
                { type: 'text', text: extractionPrompt }
              ]
            }
          ],
          max_tokens: 4000
        })
      });
      
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('OpenAI error:', res.status, body.slice(0, 200));
        return json({ error_code: 'openai_http_error', status: res.status, details: body.slice(0, 200) }, 502);
      }
      
      const payload = await res.json();
      const content = payload.choices?.[0]?.message?.content ?? '';
      
      let parsed: any;
      try {
        parsed = parseJsonSafe(content);
        console.log('✅ JSON parsed successfully');
      } catch (e: any) {
        console.error('❌ JSON parse error:', e.message);
        console.error('Content sample:', content.slice(0, 300));
        return json({ 
          error_code: 'invalid_json_from_model', 
          details: e.message,
          sample: content.slice(0, 200)
        }, 502);
      }

      const items = [];

      if (parsed.specifications) {
        for (const spec of parsed.specifications) {
          items.push({
            plan_id: planId,
            page_number: pageNumber || 1,
            item_type: 'specification',
            description: spec.item,
            specifications: spec.specification,
            quantity: spec.quantity || null,
            unit: 'LS',
            notes: `${spec.division} - ${spec.section}\nStandards: ${spec.standards?.join(', ') || 'N/A'}\n${spec.notes || ''}`
          });
        }
      }

      // Store wall type legend entries
      for (const wt of parsed.wall_types_legend || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'wall_type_legend',
          wall_type: wt.type_code,
          description: wt.description,
          wall_materials: JSON.stringify({
            composition: wt.composition,
            stud_size: wt.stud_size,
            stud_spacing: wt.stud_spacing,
            layers_each_side: wt.layers_each_side,
            drywall_type: wt.drywall_type,
            fire_rating: wt.fire_rating,
            stc_rating: wt.stc_rating
          }),
          unit: 'EA',
          quantity: 1,
          notes: `Fire Rating: ${wt.fire_rating || 'N/A'} | STC: ${wt.stc_rating || 'N/A'} | Studs: ${wt.stud_size || 'TBD'} @ ${wt.stud_spacing || 'TBD'}`
        });
      }

      // Store individual wall segments with type code and coordinates
      for (const wall of parsed.walls || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'wall',
          quantity: wall.length_ft,
          unit: 'LF',
          dimensions: JSON.stringify({
            length_ft: wall.length_ft,
            from_to: wall.from_to,
            coordinates: wall.coordinates ? {
              points: [
                { x: wall.coordinates.start_x, y: wall.coordinates.start_y },
                { x: wall.coordinates.end_x, y: wall.coordinates.end_y }
              ]
            } : null
          }),
          confidence_score: wall.confidence,
          room_name: wall.room_name,
          wall_type: wall.wall_type_code,
          linear_footage: wall.length_ft,
          notes: wall.notes || ''
        });
      }

      // Store wall type totals for quick reference
      for (const total of parsed.wall_type_totals || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'wall_type_total',
          wall_type: total.type_code,
          quantity: total.total_linear_ft,
          unit: 'LF',
          linear_footage: total.total_linear_ft,
          notes: `Total: ${total.wall_count} wall segments`
        });
      }

      // Store clarification questions for user response
      const clarifications = parsed.clarifications_needed || [];
      if (clarifications.length > 0) {
        console.log(`📋 ${clarifications.length} clarification questions to store`);
        for (const q of clarifications) {
          const { error: qErr } = await supabaseClient
            .from('ai_clarification_questions')
            .insert({
              plan_id: planId,
              user_id: user.id,
              question_type: q.question_type,
              question_text: q.question,
              context: q.context,
              affects_items: q.affects_wall_types || [],
              page_number: pageNumber || 1
            });
          if (qErr) {
            console.warn('⚠️ Could not store clarification question:', qErr.message);
          }
        }
      }


      for (const ceiling of parsed.ceilings || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'ceiling',
          quantity: ceiling.area_sqft,
          unit: 'SF',
          confidence_score: ceiling.confidence,
          room_name: ceiling.room_name,
          ceiling_type: ceiling.ceiling_type,
          ceiling_area_sqft: ceiling.area_sqft,
          dimensions: ceiling.coordinates ? JSON.stringify({
            coordinates: { x: ceiling.coordinates.x, y: ceiling.coordinates.y, width: ceiling.coordinates.width, height: ceiling.coordinates.height }
          }) : null
        });
      }

      for (const door of parsed.doors || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'door',
          quantity: door.count || 1,
          unit: 'EA',
          room_name: door.room_name,
          door_material: door.type,
          door_size: door.size,
          dimensions: door.coordinates ? JSON.stringify({
            coordinates: { x: door.coordinates.x, y: door.coordinates.y }
          }) : null
        });
      }

      for (const window of parsed.windows || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'window',
          quantity: window.count || 1,
          unit: 'EA',
          room_name: window.room_name,
          window_material: window.type,
          window_size: window.size,
          dimensions: window.coordinates ? JSON.stringify({
            coordinates: { x: window.coordinates.x, y: window.coordinates.y }
          }) : null
        });
      }

      console.log(`📝 Attempting to insert ${items.length} items`);

      if (items.length > 0) {
        // Sanitize items to only include allowed columns
        const allowedCols = new Set([
          'plan_id', 'page_number', 'item_type', 'description', 'quantity', 'unit', 'dimensions', 'confidence_score',
          'room_name', 'wall_type', 'ceiling_type', 'linear_footage', 'wall_height', 'ceiling_area_sqft',
          'door_material', 'window_material', 'notes', 'specifications', 'door_size', 'hardware_package', 'hardware_components',
          'window_size', 'ceiling_height', 'wall_materials', 'ceiling_type_detail', 'door_schedule_reference', 'window_schedule_reference',
          'sheet_number', 'sheet_title', 'drawing_scale', 'revision_number', 'revision_date', 'detail_references', 'section_references',
          'room_number', 'room_area', 'material_spec', 'raw_dimensions', 'calculated_from_scale', 'scale_factor', 'plan_upload_id',
          'needs_clarification', 'clarification_notes', 'wall_classification', 'cross_reference_notes', 'spec_reference', 'door_type'
        ]);
        
        const sanitized = items.map((obj: any) => 
          Object.fromEntries(Object.entries(obj).filter(([k]) => allowedCols.has(k)))
        );
        
        console.log(`📝 Sanitized ${sanitized.length} items for insert`);
        
        const { data: tData, error: tErr } = await supabaseClient
          .from('takeoff_data')
          .insert(sanitized)
          .select('id');
          
        if (tErr) {
          console.error('❌ DB INSERT ERROR:', tErr);
          console.error('Error code:', tErr.code);
          console.error('Error message:', tErr.message);
          console.error('Error details:', tErr.details);
          console.error('Error hint:', tErr.hint);
          return json({ 
            error_code: 'db_insert_takeoff_error', 
            details: tErr.message,
            hint: tErr.hint,
            code: tErr.code
          }, 500);
        }
        console.log('✅ DB INSERT SUCCESS:', tData?.length, 'items inserted');
        console.log('Inserted IDs:', tData?.map(d => d.id).join(', '));
      }


      return json({
        success: true,
        extracted: parsed,
        itemsStored: items.length,
        wallTypesFound: parsed.wall_types_legend?.length || 0,
        wallTypeTotals: parsed.wall_type_totals || [],
        clarificationsNeeded: clarifications,
        message: `Successfully extracted and stored ${items.length} items. ${clarifications.length > 0 ? `${clarifications.length} questions need your input for accurate material calculations.` : ''}`
      });
    }


  } catch (error: any) {
    console.error('❌ FUNCTION ERROR:', error);
    console.error('Stack:', error.stack);
    return json({ 
      error: error.message, 
      error_code: 'function_error',
      stack: error.stack 
    }, 500);
  }
});
