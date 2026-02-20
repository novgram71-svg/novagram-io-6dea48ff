/**
 * AI Chat Edge Function
 * Provides AI-powered chat responses with image generation, memory, and abuse detection
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  checkRateLimit,
  rateLimitResponse,
  validationSchemas,
  validateInput,
  validationErrorResponse,
  parseRequestBody,
  getClientIP,
  logSecurityEvent,
} from "../_shared/security.ts";

// Vulgar/abuse word patterns to detect
const abusivePatterns = [
  /\b(fuck|shit|damn|ass|bitch|bastard|crap|piss|dick|cock|pussy|cunt|whore|slut)\b/gi,
  /\b(kill|murder|die|death|hate|attack|destroy|hurt|harm|abuse)\s+(you|me|him|her|them|myself|yourself)\b/gi,
  /\b(idiot|stupid|moron|retard|dumb|loser)\b/gi,
  /\b(racist|sexist|bigot|nazi)\b/gi,
];

function detectAbuse(message: string): { isAbusive: boolean; issues: string[]; severity: string } {
  const issues: string[] = [];
  let severity = 'low';
  for (const pattern of abusivePatterns) {
    const matches = message.match(pattern);
    if (matches) {
      issues.push(...matches);
      severity = matches.length > 2 ? 'high' : 'medium';
    }
  }
  return { isAbusive: issues.length > 0, issues: [...new Set(issues)], severity };
}

// Detect if user is asking to generate an image
function isImageGenerationRequest(message: string): boolean {
  const imgPatterns = [
    /generate\s+(an?\s+)?image/i,
    /create\s+(an?\s+)?image/i,
    /make\s+(an?\s+)?image/i,
    /draw\s+(an?\s+)?/i,
    /paint\s+(an?\s+)?/i,
    /create\s+(an?\s+)?picture/i,
    /generate\s+(an?\s+)?picture/i,
    /show\s+me\s+(an?\s+)?image/i,
    /can\s+you\s+(draw|paint|sketch|generate|create)/i,
  ];
  return imgPatterns.some(p => p.test(message));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const parseResult = await parseRequestBody(req, 50 * 1024);
    if (!parseResult.success) return validationErrorResponse([parseResult.error!]);
    const body = parseResult.data!;

    const validation = validateInput(body, validationSchemas['ai-chat']);
    if (!validation.valid) return validationErrorResponse(validation.errors);

    const { message, userId, imageDataUrl } = validation.sanitizedData as { message: string; userId: string; imageDataUrl?: string };

    const rateLimit = await checkRateLimit(req, 'ai-chat', userId);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfter!);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check abuse
    const abuseCheck = detectAbuse(message);
    if (abuseCheck.isAbusive) {
      await logSecurityEvent(supabaseUrl, supabaseKey, {
        userId, action: 'ai_abuse_detected', ipAddress: getClientIP(req),
        userAgent: req.headers.get('user-agent') || undefined,
        details: { issues: abuseCheck.issues, severity: abuseCheck.severity }
      });
      await supabase.from('ai_abuse_reports').insert({
        user_id: userId,
        message_content: message.substring(0, 1000),
        detected_issues: abuseCheck.issues,
        severity: abuseCheck.severity
      });
      return new Response(JSON.stringify({
        response: "I've detected inappropriate language in your message. Please keep the conversation respectful. This incident has been reported.",
        reported: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch existing user memory profile
    let userMemory = '';
    let currentProfile: any = null;
    if (userId) {
      const { data: profileData } = await supabase
        .from('ai_user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      currentProfile = profileData;
      if (profileData) {
        const parts = [];
        if (profileData.name) parts.push(`Name: ${profileData.name}`);
        if (profileData.age) parts.push(`Age: ${profileData.age}`);
        if (profileData.location) parts.push(`Location: ${profileData.location}`);
        if (profileData.occupation) parts.push(`Occupation: ${profileData.occupation}`);
        if (profileData.interests?.length) parts.push(`Interests: ${profileData.interests.join(', ')}`);
        if (profileData.personality_notes) parts.push(`Notes: ${profileData.personality_notes}`);
        if (parts.length) userMemory = `\n\nUser profile (remembered from previous chats):\n${parts.join('\n')}`;
      }
    }

    // Handle image generation
    if (isImageGenerationRequest(message) && !imageDataUrl) {
      const imgResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          messages: [{ role: 'user', content: message }],
          modalities: ['image', 'text']
        }),
      });

      if (imgResponse.ok) {
        const imgData = await imgResponse.json();
        const generatedImage = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        const textResponse = imgData.choices?.[0]?.message?.content || 'Here is your generated image!';
        
        return new Response(JSON.stringify({
          response: textResponse,
          generatedImageUrl: generatedImage,
          reported: false
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Build user message content
    const userContent: any[] = [];
    if (imageDataUrl) userContent.push({ type: 'image_url', image_url: { url: imageDataUrl } });
    userContent.push({ type: 'text', text: message });

    // System prompt with memory instructions
    const systemPrompt = `You are Nova, a friendly and knowledgeable AI assistant for Novagram — like a smart best friend who remembers things about you.

You can answer ANY question on any topic, analyze images, and you genuinely care about the people you talk to.${userMemory}

MEMORY INSTRUCTIONS:
- Naturally weave in what you know about the user when relevant (e.g., "Since you're interested in photography...")
- Occasionally ask ONE friendly, casual question to learn more about the person (e.g., "By the way, what do you do for work?" or "Where are you from?") — but only if it feels natural, not every message
- Questions to try to learn over time: name, age, location, occupation, interests, hobbies
- If the user shares personal info, acknowledge it warmly

After this response, include a special JSON block at the very end with any new info learned (wrap it in <MEMORY_UPDATE> tags):
<MEMORY_UPDATE>{"name": null, "age": null, "location": null, "occupation": null, "interests": [], "personality_notes": null}</MEMORY_UPDATE>
Only include fields with NEW data learned in THIS message. Use null for fields not updated. Only add to interests array, don't replace.

Be friendly, accurate, and use emojis occasionally. Keep responses concise unless asked for detail.`;

    const chatResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: imageDataUrl ? userContent : message }
        ],
        max_tokens: 800,
        temperature: 0.75
      }),
    });

    if (!chatResponse.ok) {
      const err = await chatResponse.text();
      console.error('AI Gateway error:', err);
      throw new Error(`AI Gateway error: ${chatResponse.status}`);
    }

    const data = await chatResponse.json();
    let aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request right now.";

    // Parse and save memory update
    const memoryMatch = aiResponse.match(/<MEMORY_UPDATE>([\s\S]*?)<\/MEMORY_UPDATE>/);
    if (memoryMatch && userId) {
      try {
        const memoryData = JSON.parse(memoryMatch[1]);
        const updateObj: any = { last_updated: new Date().toISOString() };
        if (memoryData.name) updateObj.name = memoryData.name;
        if (memoryData.age) updateObj.age = memoryData.age;
        if (memoryData.location) updateObj.location = memoryData.location;
        if (memoryData.occupation) updateObj.occupation = memoryData.occupation;
        if (memoryData.personality_notes) updateObj.personality_notes = memoryData.personality_notes;
        if (memoryData.interests?.length) {
          const existing = currentProfile?.interests || [];
          updateObj.interests = [...new Set([...existing, ...memoryData.interests])];
        }

        if (Object.keys(updateObj).length > 1) {
          if (currentProfile) {
            await supabase.from('ai_user_profiles').update(updateObj).eq('user_id', userId);
          } else {
            await supabase.from('ai_user_profiles').insert({ user_id: userId, ...updateObj });
          }

          // Generate summary
          const allData = { ...currentProfile, ...updateObj };
          const summaryParts = [];
          if (allData.name) summaryParts.push(allData.name);
          if (allData.age) summaryParts.push(`${allData.age} years old`);
          if (allData.occupation) summaryParts.push(allData.occupation);
          if (allData.location) summaryParts.push(`from ${allData.location}`);
          if (allData.interests?.length) summaryParts.push(`interested in ${allData.interests.slice(0, 3).join(', ')}`);
          if (summaryParts.length > 0) {
            const summary = summaryParts.join(', ');
            await supabase.from('ai_user_profiles')
              .update({ conversation_summary: summary })
              .eq('user_id', userId);
          }
        }
      } catch (e) {
        console.error('Memory update error:', e);
      }
      // Strip the memory block from the response
      aiResponse = aiResponse.replace(/<MEMORY_UPDATE>[\s\S]*?<\/MEMORY_UPDATE>/g, '').trim();
    }

    return new Response(JSON.stringify({ response: aiResponse, reported: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
