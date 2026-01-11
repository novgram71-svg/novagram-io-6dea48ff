/**
 * AI Chat Edge Function
 * Provides AI-powered chat responses with abuse detection
 * 
 * Security features:
 * - Rate limiting (20 requests per minute per user/IP)
 * - Input validation and sanitization
 * - Abuse content detection and reporting
 * - Secure API key handling (environment variables only)
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

  return {
    isAbusive: issues.length > 0,
    issues: [...new Set(issues)],
    severity
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body safely
    const parseResult = await parseRequestBody(req, 50 * 1024); // 50KB max
    if (!parseResult.success) {
      return validationErrorResponse([parseResult.error!]);
    }
    const body = parseResult.data!;

    // Validate input
    const validation = validateInput(body, validationSchemas['ai-chat']);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { message, userId } = validation.sanitizedData as { message: string; userId: string };

    // Check rate limit
    const rateLimit = await checkRateLimit(req, 'ai-chat', userId);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    // Get environment variables (never hardcoded)
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for abusive content
    const abuseCheck = detectAbuse(message);
    
    if (abuseCheck.isAbusive) {
      // Log security event
      await logSecurityEvent(supabaseUrl, supabaseKey, {
        userId,
        action: 'ai_abuse_detected',
        ipAddress: getClientIP(req),
        userAgent: req.headers.get('user-agent') || undefined,
        details: { issues: abuseCheck.issues, severity: abuseCheck.severity }
      });

      // Report to admin
      await supabase.from('ai_abuse_reports').insert({
        user_id: userId,
        message_content: message.substring(0, 1000), // Limit stored content
        detected_issues: abuseCheck.issues,
        severity: abuseCheck.severity
      });

      return new Response(
        JSON.stringify({
          response: "I've detected inappropriate language in your message. Please keep the conversation respectful. This incident has been reported to our moderation team.",
          reported: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are Nova, a friendly and helpful AI assistant for Novagram - a social media platform similar to Instagram. 
            
You help users with:
- Understanding how to use the platform features
- Tips for creating great content
- Answering questions about privacy and security
- General social media advice
- Being a friendly companion to chat with

Keep responses concise, friendly, and helpful. Use emojis occasionally to keep the tone light and engaging.
If users ask about inappropriate topics, politely redirect the conversation.`
          },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI Gateway error:', error);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request right now. Please try again.";

    return new Response(
      JSON.stringify({ response: aiResponse, reported: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
