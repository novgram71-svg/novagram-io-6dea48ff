/**
 * Push Notification Edge Function
 * Sends push notifications via Firebase Cloud Messaging
 * 
 * Security features:
 * - JWT authentication required
 * - Rate limiting (50 requests per minute)
 * - Input validation and sanitization
 * - Secure API key handling (environment variables only)
 */

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
} from "../_shared/security.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Parse request body safely
    const parseResult = await parseRequestBody(req, 20 * 1024);
    if (!parseResult.success) {
      return validationErrorResponse([parseResult.error!]);
    }
    const body = parseResult.data!;

    // Validate input
    const validation = validateInput(body, validationSchemas['send-push-notification']);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { userId, title, body: notificationBody, data } = 
      validation.sanitizedData as {
        userId: string;
        title: string;
        body: string;
        data?: Record<string, unknown>;
      };

    // Check rate limit
    const rateLimit = await checkRateLimit(req, 'send-push-notification', callerId);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    console.log('Sending push notification to user:', userId);

    const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user');
      return new Response(
        JSON.stringify({ success: true, message: 'No tokens to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If Firebase key is configured, send actual push notifications
    if (firebaseServerKey) {
      const notifications = tokens.map(async ({ token }) => {
        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${firebaseServerKey}`,
            },
            body: JSON.stringify({
              to: token,
              notification: {
                title,
                body: notificationBody,
                icon: '/favicon.ico',
              },
              data: data ? Object.fromEntries(
                Object.entries(data).filter(([_, v]) => typeof v === 'string' || typeof v === 'number')
              ) : undefined,
            }),
          });

          const result = await response.json();
          console.log('FCM response:', result);
          return result;
        } catch (error: unknown) {
          console.error('FCM error for token:', token, error);
          return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      await Promise.all(notifications);
    } else {
      console.log('Firebase key not configured, skipping FCM');
    }

    return new Response(
      JSON.stringify({ success: true, tokenCount: tokens.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
