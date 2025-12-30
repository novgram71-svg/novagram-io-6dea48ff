import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for abusive content
    const abuseCheck = detectAbuse(message);
    
    if (abuseCheck.isAbusive) {
      // Report to admin
      await supabase.from('ai_abuse_reports').insert({
        user_id: userId,
        message_content: message,
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
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
