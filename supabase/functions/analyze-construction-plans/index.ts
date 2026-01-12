import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  // Always handle CORS preflight first
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Wrap everything in try-catch to ensure CORS headers are always returned
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
      if (analysisConfig?.specDivisions && Array.isArray(analysisConfig.specDivisions) && analysisConfig.specDivisions.length > 0) {
        extractionPrompt = `Analyze this construction specification document image. Focus on divisions: ${analysisConfig.specDivisions.join(', ')}. Extract specifications you can see. Return JSON: {"specifications": [{"division": "string", "section": "string", "item": "string", "specification": "string", "quantity": "string", "standards": [], "notes": "string"}]}`;
      } else {
        extractionPrompt = `You are performing a comprehensive multi-scope construction takeoff. Extract data for: FRAMING, DRYWALL, CEILINGS, INSULATION, DOORS/FRAMES/HARDWARE, MILLWORK, CASEWORK, WINDOWS, and BATHROOM ACCESSORIES.

ALWAYS SEPARATE DATA BY:
- Floor/Level (Level 1, Level 2, etc.)
- Phase (if applicable)
- Area/Zone (Apartments, Common Areas, Clubhouse, etc.)
- Unit Type (1BR, 2BR, Studio, etc.)

=== SHEET TYPES ===
- FLOOR PLAN / ID PLAN: Room layouts, door/window locations, room dimensions
- REFLECTED CEILING PLAN (RCP): Ceiling layouts, heights, types
- DOOR SCHEDULE: Complete door information
- WINDOW SCHEDULE: Complete window information
- FINISH SCHEDULE: Room finishes, ceilings, bases
- HARDWARE SCHEDULE/SETS: Door hardware groups
- PARTITION/WALL TYPES: Wall assemblies
- CABINET ELEVATIONS: Kitchen/bath cabinet details
- MILLWORK DETAILS: Trim profiles, casework details
- STRUCTURAL: Framing, hardware
- SPECIFICATIONS (SPECS): Detailed requirements by CSI division

=== SCOPE 1: FRAMING & DRYWALL ===
- Wall linear footage by type (with floor/area)
- Wall type specs (studs, gauge, spacing, layers)
- Sheathing (DensGlass, plywood)
- Fire ratings, UL numbers, STC ratings
- Seismic requirements and hardware

=== SCOPE 2: CEILINGS ===
For EVERY room (including hallways):
- Room name, number, floor level, area/unit type
- Square footage (SF)
- Perimeter (LF) for edge trim
- Ceiling height
- Ceiling type: DRYWALL | ACT (acoustical) | SPECIALTY | SOUND ASSEMBLY | UL RATED
- Insulation above: type, R-value, SAB
- Seismic bracing requirements

=== SCOPE 3: THERMAL & SOUND INSULATION ===
Extract from wall types, ceiling schedules, specs, general notes:
- Location (walls, ceilings, floors, exterior)
- Type (fiberglass batt, blown-in, rigid, mineral wool, SAB)
- R-value
- Thickness
- STC/IIC requirements
- Fire rating requirements

=== SCOPE 4: DOORS, FRAMES & HARDWARE ===
From DOOR SCHEDULE, floor plans, ID plans, specs:

DOORS:
- Door mark/number
- Size (width x height x thickness)
- Door type: HOLLOW METAL | WOOD | PREHUNG | FIRE-RATED
- Material: Steel, Wood, FRP, Glass
- Wood species (if wood): Oak, Maple, Birch, etc.
- Wood veneer: Rotary, Plain sliced, etc.
- Style: Flush, Panel, Louver, Vision lite
- Fire rating (20min, 45min, 60min, 90min)
- Smoke rating
- Acoustic rating (STC)
- Location (room, floor, unit type)

FRAMES:
- Frame type: HOLLOW METAL | WOOD | ALUMINUM
- Frame profile/series
- Gauge (for HM): 16ga, 14ga
- Anchor type
- Fire label

HARDWARE (from hardware schedule/sets/specs):
- Hardware set number
- Lockset type: Passage, Privacy, Classroom, Storeroom, Entry
- Manufacturer
- Finish (US26D, US32D, etc.)
- Hinges: Type, size, quantity
- Closer: Type, size
- Stops
- Weatherstripping
- Threshold
- ADA compliance

=== SCOPE 5: MILLWORK & TRIM ===
- BASE TRIM: Profile, size, material, linear footage per room
- DOOR CASING: Profile, size, material
- WINDOW CASING: Profile, size, material
- CROWN MOLDING: Profile, size, locations
- CHAIR RAIL: Profile, locations
- PANELING: Material, area, locations

=== SCOPE 6: CASEWORK ===
KITCHEN CABINETS:
- Cabinet type (base, wall, tall)
- Size (W x D x H)
- Door style
- Material/species
- Finish
- Hardware (pulls, knobs)
- Location/unit type

BATHROOM CABINETS (VANITIES):
- Vanity type
- Size
- Countertop type
- Location/unit type

=== SCOPE 7: WINDOWS ===
From WINDOW SCHEDULE, elevations, specs:
- Window mark/number
- Size (W x H)
- Type: Fixed, Casement, Double-hung, Slider, Awning
- Material: Vinyl, Aluminum, Wood, Fiberglass
- Manufacturer/vendor (if noted)
- Glass type: Clear, Low-E, Tempered, Laminated
- Frame color
- Multi-lite configuration (note if large windows are broken into sections)
- U-value/SHGC (if noted)
- Location (floor, elevation, unit type)
- NOTE: Large windows may be "mulled" (joined) on site - extract as shown

=== SCOPE 8: BATHROOM ACCESSORIES & PARTITIONS ===
TOILET PARTITIONS:
- Type: Floor-mounted, Ceiling-hung, Floor-to-ceiling
- Material/core: Solid plastic, Phenolic, Powder-coated steel, Stainless steel
- Manufacturer/brand
- Color
- Configuration (stalls, urinal screens)

ACCESSORIES:
- Item type: Grab bars, Paper holders, Towel bars, Mirrors, Shelves
- Manufacturer/brand
- Material/finish
- ADA compliance
- Locations

${analysisConfig?.drawingScale ? `Drawing scale provided: ${analysisConfig.drawingScale}` : ''}

Return JSON:
{
  "sheet_type": "string",
  "drawing_info": {"sheet_number": "string", "scale": "string", "title": "string", "floor_level": "string", "phase": "string or null"},
  "walls": [{"wall_type_code": "string", "length_ft": "number", "height_ft": "number or null", "room_name": "string", "floor_level": "string", "area_type": "string", "is_existing": "boolean", "is_exterior": "boolean", "notes": "string", "confidence": "number 0-100", "coordinates": {"start_x": "number 0-100", "start_y": "number 0-100", "end_x": "number 0-100", "end_y": "number 0-100"}}],
  "wall_types_legend": [{"type_code": "string", "description": "string", "stud_size": "string", "stud_gauge": "string", "stud_spacing": "string", "max_height": "string", "drywall_layers_each_side": "number", "drywall_type": "string", "sheathing": "string", "fire_rating": "string", "ul_number": "string", "stc_rating": "number", "insulation": "string", "insulation_r_value": "string", "confidence": "number 0-100"}],
  "wall_type_totals": [{"type_code": "string", "total_linear_ft": "number", "wall_count": "number", "floor_level": "string"}],
  "rooms": [{"room_name": "string", "room_number": "string", "area_sqft": "number", "perimeter_lf": "number", "ceiling_height": "string", "ceiling_type": "string", "floor_level": "string", "unit_type": "string", "area_type": "string", "confidence": "number 0-100"}],
  "ceilings": [{"room_name": "string", "room_number": "string", "area_sqft": "number", "perimeter_lf": "number", "ceiling_height": "string", "ceiling_category": "string", "material": "string", "grid_type": "string", "tile_size": "string", "fire_rating": "string", "ul_number": "string", "stc_rating": "number", "nrc_rating": "number", "insulation_above": "boolean", "insulation_type": "string", "insulation_r_value": "string", "seismic_bracing_required": "boolean", "floor_level": "string", "unit_type": "string", "area_type": "string", "confidence": "number 0-100"}],
  "insulation": [{"location": "string", "type": "string", "r_value": "string", "thickness": "string", "purpose": "string (thermal|sound|fire)", "wall_types": ["string"], "notes": "string", "confidence": "number 0-100"}],
  "doors": [{"mark": "string", "width": "string", "height": "string", "thickness": "string", "door_type": "string (hollow_metal|wood|prehung|fire_rated)", "material": "string", "wood_species": "string", "wood_veneer": "string", "style": "string (flush|panel|louver)", "fire_rating": "string", "smoke_rating": "string", "stc_rating": "number", "frame_type": "string", "frame_material": "string", "frame_gauge": "string", "hardware_set": "string", "room_name": "string", "floor_level": "string", "unit_type": "string", "area_type": "string", "quantity": "number", "confidence": "number 0-100", "coordinates": {"x": "number 0-100", "y": "number 0-100"}}],
  "door_hardware_sets": [{"set_number": "string", "lockset_type": "string", "lockset_function": "string", "manufacturer": "string", "finish": "string", "hinge_type": "string", "hinge_qty": "number", "closer_type": "string", "stop_type": "string", "threshold": "string", "weatherstrip": "boolean", "ada_compliant": "boolean", "confidence": "number 0-100"}],
  "millwork": [{"item_type": "string (base_trim|door_casing|window_casing|crown|chair_rail|paneling)", "profile": "string", "size": "string", "material": "string", "finish": "string", "linear_ft": "number", "area_sqft": "number", "room_name": "string", "floor_level": "string", "unit_type": "string", "confidence": "number 0-100"}],
  "casework": [{"item_type": "string (kitchen_base|kitchen_wall|kitchen_tall|vanity|other)", "size": "string", "door_style": "string", "material": "string", "finish": "string", "countertop": "string", "hardware": "string", "quantity": "number", "room_name": "string", "floor_level": "string", "unit_type": "string", "confidence": "number 0-100"}],
  "windows": [{"mark": "string", "width": "string", "height": "string", "type": "string (fixed|casement|double_hung|slider|awning)", "material": "string", "manufacturer": "string", "glass_type": "string", "frame_color": "string", "multi_lite": "boolean", "lite_config": "string", "u_value": "string", "shgc": "string", "room_name": "string", "floor_level": "string", "unit_type": "string", "elevation": "string", "quantity": "number", "confidence": "number 0-100", "coordinates": {"x": "number 0-100", "y": "number 0-100"}}],
  "bathroom_partitions": [{"type": "string (floor_mounted|ceiling_hung|floor_to_ceiling)", "material": "string", "core": "string", "manufacturer": "string", "color": "string", "configuration": "string", "stall_count": "number", "urinal_screen_count": "number", "room_name": "string", "floor_level": "string", "confidence": "number 0-100"}],
  "bathroom_accessories": [{"item_type": "string", "manufacturer": "string", "model": "string", "material": "string", "finish": "string", "ada_compliant": "boolean", "quantity": "number", "room_name": "string", "floor_level": "string", "confidence": "number 0-100"}],
  "structural_hardware": [{"item": "string", "manufacturer": "string", "quantity": "number", "location": "string", "is_seismic": "boolean", "floor_level": "string", "confidence": "number 0-100"}],
  "seismic_requirements": [{"requirement_type": "string", "description": "string", "applies_to": "string", "seismic_category": "string"}],
  "beams_headers": [{"size": "string", "length_ft": "number", "location": "string", "type": "string", "floor_level": "string", "confidence": "number 0-100"}],
  "soffits": [{"width_inches": "number", "depth_inches": "number", "length_ft": "number", "location": "string", "floor_level": "string", "confidence": "number 0-100"}],
  "deck_heights": [{"floor_level": "string", "height_ft_in": "string", "area": "string"}],
  "general_notes": [{"category": "string", "note": "string", "applies_to": "string"}],
  "ul_assemblies": [{"ul_number": "string", "fire_rating": "string", "description": "string", "assembly_type": "string"}],
  "clarifications_needed": [{"question_type": "string", "question": "string", "context": "string", "affects": "string"}],
  "confidence_summary": {"overall": "number 0-100", "by_category": {"walls": "number", "ceilings": "number", "doors": "number", "windows": "number", "millwork": "number", "casework": "number"}}
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
          max_tokens: 16000,
          messages: [
            {
              role: 'system',
              content: `You are an expert commercial construction estimator with 25+ years experience in MULTI-FAMILY construction. You perform comprehensive takeoffs for multiple scopes.

=== SHEET TYPE IDENTIFICATION ===
Identify sheet type from sheet number prefix:
- A0.xx: Cover, Index - Extract project name, sheet list
- A1.xx: Floor Plans - Walls, doors, windows, room names/numbers, dimensions
- A2.xx: Exterior Elevations - Window locations, materials
- A3.xx: Building Sections - Heights, floor-to-floor dimensions
- A4.xx: Wall Sections - Wall types, assembly details
- A5.xx: Details - Material specs, dimensions
- A6.xx: Schedules - Door/Window/Finish schedules
- A7.xx: Reflected Ceiling Plans - Ceiling types, heights, areas
- A8.xx: Interior Elevations - Cabinets, trim, millwork
- ID1-4.xx: Interior Design plans
- S1-3.xx: Structural plans

=== SCOPES YOU EXTRACT ===
1. FRAMING & DRYWALL: Walls, studs, sheathing, fire ratings
2. CEILINGS: Drywall, ACT, specialty - with SF, perimeter, insulation, seismic
3. THERMAL/SOUND INSULATION: R-values, STC, locations
4. DOORS/FRAMES/HARDWARE: Hollow metal, wood, prehung, hardware sets
5. MILLWORK: Base trim, casings, paneling
6. CASEWORK: Kitchen cabinets, bathroom vanities
7. WINDOWS: Types, materials, sizes, multi-lite configurations
8. BATHROOM ACCESSORIES & PARTITIONS: Brands, materials, core types

=== CONFIDENCE SCORING (0-100) ===
Assign a confidence score to EVERY extracted item:
- 90-100 (High): Item clearly labeled with dimensions, appears in schedule with complete info, consistent across sheets
- 70-89 (Good): Item visible but needs interpretation, partial info in schedule, dimensions can be scaled
- 50-69 (Moderate): Item implied but not explicit, cross-reference needed, standard assumptions applied
- 30-49 (Low): Significant assumptions made, info incomplete/unclear, needs verification
- 0-29 (Very Low): Educated guess only, contradictory info, recommend RFI

=== COORDINATE EXTRACTION (CRITICAL) ===
For EVERY wall, door, and window, you MUST extract coordinates relative to the drawing:
- Walls: start_x, start_y, end_x, end_y (0-100 scale where 0,0 is top-left)
- Doors/Windows: x, y center position (0-100 scale)
These coordinates are used for visual markup - extraction without coordinates is incomplete.

=== WALL TYPE NOTATION ===
Parse wall type legends to extract:
- Stud size (e.g., 3-5/8")
- Stud spacing (e.g., 16" O.C.)
- Drywall layers each side
- STC rating
- Fire rating
- UL number

=== CRITICAL RULES ===
1. ALWAYS separate by: Floor Level, Phase, Area/Zone, Unit Type
2. Extract from ALL sheet types - don't skip any
3. Calculate room SF and perimeter from dimensions
4. Cross-reference between schedules, plans, and specs
5. Note SEISMIC requirements - affects hardware selection
6. For DOORS: Get mark, size, type, species, veneer, style, frame, hardware set
7. For WINDOWS: Note if large windows are mulled/broken into sections
8. For CASEWORK: Capture style, material, finish, hardware
9. For BATHROOM PARTITIONS: Get material/core (phenolic, solid plastic, etc.)
10. NEVER guess without flagging low confidence
11. Missing coordinates = incomplete extraction

=== COMMON ERRORS TO AVOID ===
1. Missing items: Check ALL sheet areas
2. Double counting: Same item on multiple sheets
3. Wrong units: LF vs SF vs EA
4. Scale errors: Verify scale matches dimensions
5. Demo vs new: Don't count items to be demolished

Be thorough. Missing items cost money. Always respond with valid JSON with confidence scores.`
            },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
                { type: 'text', text: extractionPrompt }
              ]
            }
          ]
        })
      });
      
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('OpenAI error:', res.status, body.slice(0, 500));

        // Try to parse error details
        let errorDetails = body.slice(0, 200);
        try {
          const errorJson = JSON.parse(body);
          errorDetails = errorJson.error?.message || errorJson.message || body.slice(0, 200);
          console.error('Parsed error:', errorJson);
        } catch (e) {
          console.error('Could not parse error body');
        }

        return json({
          error_code: 'openai_http_error',
          status: res.status,
          details: errorDetails,
          page: pageNumber
        }, 502);
      }
      
      const payload = await res.json();
      const content = payload.choices?.[0]?.message?.content ?? '';
      const finishReason = payload.choices?.[0]?.finish_reason;

      console.log('OpenAI finish_reason:', finishReason);
      console.log('OpenAI usage:', payload.usage);

      if (finishReason === 'length') {
        console.warn('⚠️ Response truncated due to max_tokens limit');
      }

      let parsed: any;
      try {
        parsed = parseJsonSafe(content);
        console.log('✅ JSON parsed successfully');
      } catch (e: any) {
        console.error('❌ JSON parse error:', e.message);
        console.error('Content sample:', content.slice(0, 300));
        console.error('Finish reason:', finishReason);
        return json({
          error_code: 'invalid_json_from_model',
          details: e.message,
          sample: content.slice(0, 200),
          finish_reason: finishReason,
          page: pageNumber
        }, 502);
      }

      // Extract data from ALL sheet types - no longer skipping non-floor plans
      console.log(`📋 Page ${pageNumber} - Sheet type: ${parsed.sheet_type || 'Unknown'}. Extracting all relevant data.`);

      const items = [];

      // ALWAYS store sheet info for cross-referencing - even if no takeoff items
      // This ensures detail sheets, schedules, notes pages are captured
      const drawingInfo = parsed.drawing_info || {};
      items.push({
        plan_id: planId,
        page_number: pageNumber || 1,
        item_type: 'sheet_info',
        description: `${parsed.sheet_type || 'Unknown Sheet'} - ${drawingInfo.title || drawingInfo.sheet_number || `Page ${pageNumber}`}`,
        quantity: 1,
        unit: 'EA',
        sheet_number: drawingInfo.sheet_number,
        sheet_title: drawingInfo.title,
        drawing_scale: drawingInfo.scale,
        revision_number: drawingInfo.revision_number,
        revision_date: drawingInfo.revision_date,
        notes: `Sheet Type: ${parsed.sheet_type || 'Unknown'} | Floor: ${drawingInfo.floor_level || 'N/A'} | Phase: ${drawingInfo.phase || 'N/A'} | Scale: ${drawingInfo.scale || 'N/A'}`
      });

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

      // Store wall type legend entries with expanded fields
      for (const wt of parsed.wall_types_legend || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'wall_type_legend',
          wall_type: wt.type_code,
          description: wt.description,
          wall_materials: JSON.stringify({
            stud_size: wt.stud_size,
            stud_gauge: wt.stud_gauge,
            stud_spacing: wt.stud_spacing,
            max_height: wt.max_height,
            drywall_layers_each_side: wt.drywall_layers_each_side,
            drywall_type: wt.drywall_type,
            fire_rating: wt.fire_rating,
            ul_number: wt.ul_number,
            stc_rating: wt.stc_rating,
            insulation: wt.insulation
          }),
          unit: 'EA',
          quantity: 1,
          notes: `Fire: ${wt.fire_rating || 'N/A'} | UL: ${wt.ul_number || 'N/A'} | STC: ${wt.stc_rating || 'N/A'} | Studs: ${wt.stud_size || 'TBD'} ${wt.stud_gauge || ''} @ ${wt.stud_spacing || 'TBD'} | Max Ht: ${wt.max_height || 'TBD'}`
        });
      }

      // Store individual wall segments with type code, coordinates, confidence, and new fields
      for (const wall of parsed.walls || []) {
        // Determine wall classification
        let wallClassification = 'interior';
        if (wall.is_existing) wallClassification = 'existing';
        else if (wall.is_exterior) wallClassification = 'exterior';

        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'wall',
          quantity: wall.length_ft,
          unit: 'LF',
          confidence_score: wall.confidence || 50,
          dimensions: JSON.stringify({
            length_ft: wall.length_ft,
            height_ft: wall.height_ft,
            from_to: wall.from_to,
            coordinates: wall.coordinates ? {
              points: [
                { x: wall.coordinates.start_x, y: wall.coordinates.start_y },
                { x: wall.coordinates.end_x, y: wall.coordinates.end_y }
              ]
            } : null
          }),
          room_name: wall.room_name,
          wall_type: wall.wall_type_code,
          wall_height: wall.height_ft,
          linear_footage: wall.length_ft,
          wall_classification: wallClassification,
          notes: `[Confidence: ${wall.confidence || 50}%] ${wall.is_existing ? '[EXISTING] ' : ''}${wall.is_exterior ? '[EXTERIOR] ' : ''}${wall.notes || ''}`
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
          // Store clarification as a takeoff_data item instead to avoid schema issues
          items.push({
            plan_id: planId,
            page_number: pageNumber || 1,
            item_type: 'clarification_needed',
            description: q.question,
            quantity: 1,
            unit: 'EA',
            notes: `Type: ${q.question_type || 'general'} | Context: ${q.context || 'N/A'} | Affects: ${q.affects || q.affects_wall_types?.join(', ') || 'N/A'}`
          });
        }
      }


      // Store rooms with SF and perimeter
      for (const room of parsed.rooms || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'room',
          description: room.room_name,
          room_name: room.room_name,
          room_number: room.room_number,
          room_area: room.area_sqft,
          quantity: room.area_sqft,
          unit: 'SF',
          ceiling_height: room.ceiling_height,
          ceiling_type: room.ceiling_type,
          notes: `Perimeter: ${room.perimeter_lf || 0} LF | Height: ${room.ceiling_height || 'TBD'} | Floor: ${room.floor_level || 'N/A'}`
        });
      }

      // Store detailed ceiling data with confidence and all new fields
      for (const ceiling of parsed.ceilings || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'ceiling',
          description: `${ceiling.ceiling_category || 'ceiling'} - ${ceiling.material || ceiling.ceiling_type_code || 'TBD'}`,
          quantity: ceiling.area_sqft,
          unit: 'SF',
          confidence_score: ceiling.confidence || 50,
          room_name: ceiling.room_name,
          room_number: ceiling.room_number,
          ceiling_type: ceiling.ceiling_category || 'drywall',
          ceiling_type_detail: ceiling.material,
          ceiling_area_sqft: ceiling.area_sqft,
          ceiling_height: ceiling.ceiling_height,
          dimensions: JSON.stringify({
            area_sqft: ceiling.area_sqft,
            perimeter_lf: ceiling.perimeter_lf,
            grid_type: ceiling.grid_type,
            tile_size: ceiling.tile_size,
            layers: ceiling.layers
          }),
          notes: `[Confidence: ${ceiling.confidence || 50}%] Category: ${ceiling.ceiling_category || 'N/A'} | Material: ${ceiling.material || 'TBD'} | Perimeter: ${ceiling.perimeter_lf || 0} LF | Fire: ${ceiling.fire_rating || 'N/A'} | UL: ${ceiling.ul_number || 'N/A'} | STC: ${ceiling.stc_rating || 'N/A'} | NRC: ${ceiling.nrc_rating || 'N/A'} | Insulation: ${ceiling.insulation_above ? `${ceiling.insulation_type || 'Yes'} R-${ceiling.insulation_r_value || 'TBD'}` : 'None'} | Seismic: ${ceiling.seismic_bracing_required ? `Yes (${ceiling.seismic_category || 'TBD'})` : 'No'}`
        });
      }

      // Store ceiling types legend
      for (const ct of parsed.ceiling_types_legend || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'ceiling_type_legend',
          description: `${ct.type_code} - ${ct.description}`,
          ceiling_type: ct.category,
          ceiling_type_detail: ct.material,
          quantity: 1,
          unit: 'EA',
          notes: `Category: ${ct.category || 'N/A'} | Material: ${ct.material || 'TBD'} | Fire: ${ct.fire_rating || 'N/A'} | UL: ${ct.ul_number || 'N/A'} | STC: ${ct.stc_rating || 'N/A'} | NRC: ${ct.nrc_rating || 'N/A'} | Insulation: ${ct.insulation || 'N/A'} R-${ct.insulation_r_value || 'N/A'}`
        });
      }

      // Store detailed door information with confidence and coordinates
      for (const door of parsed.doors || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: door.door_type === 'hollow_metal' ? 'hollow_metal_door' : door.door_type === 'fire_rated' ? 'fire_door' : 'door',
          description: `${door.mark || ''} - ${door.width || ''}x${door.height || ''} ${door.style || ''} ${door.material || ''}`,
          quantity: door.quantity || 1,
          unit: 'EA',
          confidence_score: door.confidence || 50,
          room_name: door.room_name,
          door_material: door.material,
          door_type: door.door_type,
          door_size: `${door.width || ''}x${door.height || ''}x${door.thickness || ''}`,
          dimensions: JSON.stringify({
            width: door.width,
            height: door.height,
            thickness: door.thickness,
            wood_species: door.wood_species,
            wood_veneer: door.wood_veneer,
            style: door.style,
            frame_type: door.frame_type,
            frame_material: door.frame_material,
            frame_gauge: door.frame_gauge,
            hardware_set: door.hardware_set,
            coordinates: door.coordinates ? { x: door.coordinates.x, y: door.coordinates.y } : null
          }),
          notes: `[Confidence: ${door.confidence || 50}%] Mark: ${door.mark || 'N/A'} | Type: ${door.door_type || 'N/A'} | Material: ${door.material || 'TBD'} | Species: ${door.wood_species || 'N/A'} | Veneer: ${door.wood_veneer || 'N/A'} | Style: ${door.style || 'N/A'} | Fire: ${door.fire_rating || 'N/A'} | Frame: ${door.frame_type || 'N/A'} ${door.frame_gauge || ''} | HW Set: ${door.hardware_set || 'N/A'} | Floor: ${door.floor_level || 'N/A'} | Unit: ${door.unit_type || 'N/A'} | Area: ${door.area_type || 'N/A'}`
        });
      }

      // Store door hardware sets
      for (const hwSet of parsed.door_hardware_sets || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'door_hardware_set',
          description: `Set ${hwSet.set_number} - ${hwSet.lockset_function || hwSet.lockset_type || 'N/A'}`,
          quantity: 1,
          unit: 'EA',
          hardware_package: hwSet.set_number,
          hardware_components: JSON.stringify({
            lockset_type: hwSet.lockset_type,
            lockset_function: hwSet.lockset_function,
            manufacturer: hwSet.manufacturer,
            finish: hwSet.finish,
            hinge_type: hwSet.hinge_type,
            hinge_qty: hwSet.hinge_qty,
            closer_type: hwSet.closer_type,
            stop_type: hwSet.stop_type,
            threshold: hwSet.threshold,
            weatherstrip: hwSet.weatherstrip,
            ada_compliant: hwSet.ada_compliant
          }),
          notes: `Set: ${hwSet.set_number || 'N/A'} | Lock: ${hwSet.lockset_function || hwSet.lockset_type || 'N/A'} | Mfr: ${hwSet.manufacturer || 'TBD'} | Finish: ${hwSet.finish || 'TBD'} | Hinge: ${hwSet.hinge_type || 'N/A'} x${hwSet.hinge_qty || 0} | Closer: ${hwSet.closer_type || 'N/A'} | ADA: ${hwSet.ada_compliant ? 'Yes' : 'No'}`
        });
      }

      // Store detailed window information with confidence and coordinates
      for (const window of parsed.windows || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: window.multi_lite ? 'window_mulled' : 'window',
          description: `${window.mark || ''} - ${window.width || ''}x${window.height || ''} ${window.type || ''} ${window.material || ''}`,
          quantity: window.quantity || 1,
          unit: 'EA',
          confidence_score: window.confidence || 50,
          room_name: window.room_name,
          window_material: window.material,
          window_size: `${window.width || ''}x${window.height || ''}`,
          dimensions: JSON.stringify({
            width: window.width,
            height: window.height,
            type: window.type,
            material: window.material,
            manufacturer: window.manufacturer,
            glass_type: window.glass_type,
            frame_color: window.frame_color,
            multi_lite: window.multi_lite,
            lite_config: window.lite_config,
            u_value: window.u_value,
            shgc: window.shgc,
            coordinates: window.coordinates ? { x: window.coordinates.x, y: window.coordinates.y } : null
          }),
          notes: `[Confidence: ${window.confidence || 50}%] Mark: ${window.mark || 'N/A'} | Type: ${window.type || 'N/A'} | Material: ${window.material || 'TBD'} | Mfr: ${window.manufacturer || 'TBD'} | Glass: ${window.glass_type || 'N/A'} | Color: ${window.frame_color || 'N/A'} | Multi-lite: ${window.multi_lite ? `Yes (${window.lite_config || ''})` : 'No'} | Floor: ${window.floor_level || 'N/A'} | Unit: ${window.unit_type || 'N/A'} | Elevation: ${window.elevation || 'N/A'}`
        });
      }

      // Store millwork items
      for (const mw of parsed.millwork || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: `millwork_${mw.item_type || 'trim'}`,
          description: `${mw.item_type || 'Trim'} - ${mw.profile || ''} ${mw.size || ''} ${mw.material || ''}`,
          quantity: mw.linear_ft || mw.area_sqft || 1,
          unit: mw.linear_ft ? 'LF' : mw.area_sqft ? 'SF' : 'EA',
          linear_footage: mw.linear_ft,
          room_name: mw.room_name,
          material_spec: mw.material,
          notes: `Type: ${mw.item_type || 'N/A'} | Profile: ${mw.profile || 'N/A'} | Size: ${mw.size || 'N/A'} | Material: ${mw.material || 'TBD'} | Finish: ${mw.finish || 'N/A'} | Floor: ${mw.floor_level || 'N/A'} | Unit: ${mw.unit_type || 'N/A'}`
        });
      }

      // Store casework (cabinets)
      for (const cw of parsed.casework || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: cw.item_type?.includes('kitchen') ? 'kitchen_cabinet' : cw.item_type?.includes('vanity') ? 'bathroom_vanity' : 'casework',
          description: `${cw.item_type || 'Cabinet'} - ${cw.size || ''} ${cw.door_style || ''} ${cw.material || ''}`,
          quantity: cw.quantity || 1,
          unit: 'EA',
          room_name: cw.room_name,
          material_spec: cw.material,
          dimensions: JSON.stringify({
            size: cw.size,
            door_style: cw.door_style,
            material: cw.material,
            finish: cw.finish,
            countertop: cw.countertop,
            hardware: cw.hardware
          }),
          notes: `Type: ${cw.item_type || 'N/A'} | Size: ${cw.size || 'N/A'} | Style: ${cw.door_style || 'N/A'} | Material: ${cw.material || 'TBD'} | Finish: ${cw.finish || 'N/A'} | Countertop: ${cw.countertop || 'N/A'} | Hardware: ${cw.hardware || 'N/A'} | Floor: ${cw.floor_level || 'N/A'} | Unit: ${cw.unit_type || 'N/A'}`
        });
      }

      // Store bathroom partitions
      for (const bp of parsed.bathroom_partitions || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'bathroom_partition',
          description: `${bp.type || 'Partition'} - ${bp.material || ''} ${bp.core || ''}`,
          quantity: (bp.stall_count || 0) + (bp.urinal_screen_count || 0) || 1,
          unit: 'EA',
          room_name: bp.room_name,
          material_spec: `${bp.material || ''} ${bp.core || ''}`.trim(),
          dimensions: JSON.stringify({
            type: bp.type,
            material: bp.material,
            core: bp.core,
            manufacturer: bp.manufacturer,
            color: bp.color,
            configuration: bp.configuration,
            stall_count: bp.stall_count,
            urinal_screen_count: bp.urinal_screen_count
          }),
          notes: `Type: ${bp.type || 'N/A'} | Material: ${bp.material || 'TBD'} | Core: ${bp.core || 'N/A'} | Mfr: ${bp.manufacturer || 'TBD'} | Color: ${bp.color || 'N/A'} | Stalls: ${bp.stall_count || 0} | Urinal Screens: ${bp.urinal_screen_count || 0} | Floor: ${bp.floor_level || 'N/A'}`
        });
      }

      // Store bathroom accessories
      for (const ba of parsed.bathroom_accessories || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'bathroom_accessory',
          description: `${ba.item_type || 'Accessory'} - ${ba.manufacturer || ''} ${ba.model || ''}`,
          quantity: ba.quantity || 1,
          unit: 'EA',
          room_name: ba.room_name,
          material_spec: ba.material,
          dimensions: JSON.stringify({
            item_type: ba.item_type,
            manufacturer: ba.manufacturer,
            model: ba.model,
            material: ba.material,
            finish: ba.finish,
            ada_compliant: ba.ada_compliant
          }),
          notes: `Type: ${ba.item_type || 'N/A'} | Mfr: ${ba.manufacturer || 'TBD'} | Model: ${ba.model || 'N/A'} | Material: ${ba.material || 'N/A'} | Finish: ${ba.finish || 'N/A'} | ADA: ${ba.ada_compliant ? 'Yes' : 'No'} | Floor: ${ba.floor_level || 'N/A'}`
        });
      }

      // Store insulation from new structure
      for (const ins of parsed.insulation || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: ins.purpose === 'sound' ? 'sound_insulation' : ins.purpose === 'fire' ? 'fire_insulation' : 'thermal_insulation',
          description: `${ins.type || 'Insulation'} R-${ins.r_value || 'TBD'} - ${ins.location || ''}`,
          quantity: 1,
          unit: 'EA',
          room_name: ins.location,
          material_spec: ins.type,
          notes: `Location: ${ins.location || 'N/A'} | Type: ${ins.type || 'TBD'} | R-Value: ${ins.r_value || 'TBD'} | Thickness: ${ins.thickness || 'TBD'} | Purpose: ${ins.purpose || 'thermal'} | Wall Types: ${ins.wall_types?.join(', ') || 'N/A'} | ${ins.notes || ''}`
        });
      }

      // Store structural hardware (Simpson, etc.) with seismic flag
      for (const hw of parsed.structural_hardware || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: hw.is_seismic ? 'seismic_hardware' : 'structural_hardware',
          description: hw.item,
          quantity: hw.quantity || 1,
          unit: 'EA',
          room_name: hw.location,
          notes: `${hw.manufacturer || 'Simpson Strong-Tie'} | ${hw.is_seismic ? '[SEISMIC] ' : ''}${hw.notes || ''}`
        });
      }

      // Store seismic requirements
      for (const seismic of parsed.seismic_requirements || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'seismic_requirement',
          description: seismic.description,
          quantity: 1,
          unit: 'EA',
          notes: `Type: ${seismic.requirement_type || 'general'} | Applies to: ${seismic.applies_to || 'both'} | Category: ${seismic.seismic_category || 'TBD'} | ${seismic.notes || ''}`
        });
      }

      // Store insulation specifications
      for (const ins of parsed.insulation_specs || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'insulation',
          description: `${ins.type || 'Insulation'} R-${ins.r_value || 'TBD'}`,
          quantity: 1,
          unit: 'EA',
          room_name: ins.location,
          notes: `Location: ${ins.location || 'N/A'} | Type: ${ins.type || 'TBD'} | R-Value: ${ins.r_value || 'TBD'} | Thickness: ${ins.thickness || 'TBD'} | Facing: ${ins.facing || 'N/A'} | ${ins.notes || ''}`
        });
      }

      // Store beams and headers
      for (const beam of parsed.beams_headers || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: beam.type || 'beam',
          description: beam.size,
          quantity: beam.length_ft || 1,
          unit: beam.length_ft ? 'LF' : 'EA',
          linear_footage: beam.length_ft,
          room_name: beam.location,
          notes: `Type: ${beam.type || 'beam'}`
        });
      }

      // Store soffits
      for (const soffit of parsed.soffits || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'soffit',
          quantity: soffit.length_ft || 1,
          unit: 'LF',
          linear_footage: soffit.length_ft,
          room_name: soffit.location,
          dimensions: JSON.stringify({
            width_inches: soffit.width_inches,
            depth_inches: soffit.depth_inches,
            length_ft: soffit.length_ft
          }),
          notes: `${soffit.width_inches}"W x ${soffit.depth_inches}"D | Framing: ${soffit.framing || 'TBD'}`
        });
      }

      // Store deck heights
      for (const dh of parsed.deck_heights || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'deck_height',
          description: `${dh.floor_level} - ${dh.height_ft_in}`,
          quantity: 1,
          unit: 'EA',
          room_name: dh.area,
          wall_height: parseFloat(dh.height_ft_in?.replace(/[^\d.]/g, '')) || null,
          notes: `Floor: ${dh.floor_level} | Height: ${dh.height_ft_in} | Area: ${dh.area || 'General'}`
        });
      }

      // Store general notes
      for (const note of parsed.general_notes || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'general_note',
          description: note.note,
          quantity: 1,
          unit: 'EA',
          notes: `Category: ${note.category || 'other'} | Applies to: ${note.applies_to || 'All'}`
        });
      }

      // Store UL assemblies with wall and ceiling references
      for (const ul of parsed.ul_assemblies || []) {
        items.push({
          plan_id: planId,
          page_number: pageNumber || 1,
          item_type: 'ul_assembly',
          description: `${ul.ul_number} - ${ul.description}`,
          quantity: 1,
          unit: 'EA',
          notes: `Fire Rating: ${ul.fire_rating} | Type: ${ul.assembly_type || 'wall'} | Wall Types: ${ul.wall_types_using?.join(', ') || 'N/A'} | Ceiling Types: ${ul.ceiling_types_using?.join(', ') || 'N/A'}`
        });
      }

      console.log(`📝 Attempting to insert ${items.length} items`);

      if (items.length > 0) {
        // Helper to sanitize numeric values
        const sanitizeNumeric = (value: any): number | null => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'number' && !isNaN(value) && isFinite(value)) return value;
          if (typeof value === 'string') {
            const str = value.trim().toLowerCase();
            // Check for non-numeric text
            if (str === '' || str === 'n/a' || str === 'tbd' || str === 'varies' || str === 'vary' || str === 'na') return null;
            const num = parseFloat(value);
            return isNaN(num) || !isFinite(num) ? null : num;
          }
          return null;
        };

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

        const sanitized = items.map((obj: any) => {
          const filtered = Object.fromEntries(Object.entries(obj).filter(([k]) => allowedCols.has(k)));

          // Sanitize numeric fields
          if (filtered.confidence_score !== undefined) {
            const score = sanitizeNumeric(filtered.confidence_score);
            filtered.confidence_score = score !== null ? Math.max(0, Math.min(100, score)) : null;
          }
          if (filtered.quantity !== undefined) {
            filtered.quantity = sanitizeNumeric(filtered.quantity);
          }
          if (filtered.linear_footage !== undefined) {
            filtered.linear_footage = sanitizeNumeric(filtered.linear_footage);
          }
          if (filtered.wall_height !== undefined) {
            filtered.wall_height = sanitizeNumeric(filtered.wall_height);
          }
          if (filtered.ceiling_area_sqft !== undefined) {
            filtered.ceiling_area_sqft = sanitizeNumeric(filtered.ceiling_area_sqft);
          }
          if (filtered.room_area !== undefined) {
            filtered.room_area = sanitizeNumeric(filtered.room_area);
          }
          if (filtered.scale_factor !== undefined) {
            filtered.scale_factor = sanitizeNumeric(filtered.scale_factor);
          }

          return filtered;
        });
        
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


      // Build summary of what was found
      const summary = {
        walls: parsed.walls?.length || 0,
        wallTypes: parsed.wall_types_legend?.length || 0,
        rooms: parsed.rooms?.length || 0,
        ceilings: parsed.ceilings?.length || 0,
        ceilingTypes: parsed.ceiling_types_legend?.length || 0,
        doors: parsed.doors?.length || 0,
        doorHardwareSets: parsed.door_hardware_sets?.length || 0,
        windows: parsed.windows?.length || 0,
        millwork: parsed.millwork?.length || 0,
        casework: parsed.casework?.length || 0,
        bathroomPartitions: parsed.bathroom_partitions?.length || 0,
        bathroomAccessories: parsed.bathroom_accessories?.length || 0,
        insulation: (parsed.insulation?.length || 0) + (parsed.insulation_specs?.length || 0),
        hardware: parsed.structural_hardware?.length || 0,
        seismicItems: parsed.seismic_requirements?.length || 0,
        beams: parsed.beams_headers?.length || 0,
        soffits: parsed.soffits?.length || 0,
        deckHeights: parsed.deck_heights?.length || 0,
        notes: parsed.general_notes?.length || 0,
        ulAssemblies: parsed.ul_assemblies?.length || 0
      };

      return json({
        success: true,
        sheet_type: parsed.sheet_type || 'Unknown',
        drawing_info: parsed.drawing_info || {},
        extracted: parsed,
        itemsStored: items.length,
        summary,
        wallTypeTotals: parsed.wall_type_totals || [],
        clarificationsNeeded: clarifications,
        message: `Sheet: ${parsed.sheet_type || 'Unknown'} | Items: ${items.length} | Walls: ${summary.walls} | Rooms: ${summary.rooms} | Ceilings: ${summary.ceilings} | Doors: ${summary.doors} | Windows: ${summary.windows} | Millwork: ${summary.millwork} | Casework: ${summary.casework} | Insulation: ${summary.insulation}`
      });
    }


  } catch (error: any) {
    console.error('❌ FUNCTION ERROR:', error);
    console.error('Stack:', error.stack);
    // Always return with CORS headers to prevent CORS errors on failures
    return new Response(
      JSON.stringify({
        error: error.message,
        error_code: 'function_error',
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
