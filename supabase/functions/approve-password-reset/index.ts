/**
 * Password Reset Approval Edge Function
 * Handles password reset requests with server-side verification
 * 
 * Security features:
 * - Rate limiting (5 requests per minute)
 * - Input validation (UUID format, password requirements)
 * - Server-side verification code validation
 * - Admin authorization check for legacy flow
 * - Security audit logging
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  checkRateLimit,
  rateLimitResponse,
  validateInput,
  validationErrorResponse,
  parseRequestBody,
  getClientIP,
  logSecurityEvent,
} from "../_shared/security.ts";

// Custom validation schema for this function
const resetValidationSchema = {
  action: {
    type: 'string' as const,
    required: true,
    pattern: /^(initiate|verify_and_reset|approve|reject)$/,
  },
  email: {
    type: 'email' as const,
    required: false,
  },
  requestId: {
    type: 'uuid' as const,
    required: false,
  },
  verificationCode: {
    type: 'string' as const,
    required: false,
    minLength: 6,
    maxLength: 6,
    pattern: /^[0-9]+$/,
  },
  newPassword: {
    type: 'string' as const,
    required: false,
    minLength: 6,
    maxLength: 128,
  },
};

/**
 * Generate a cryptographically random 6-digit code
 */
function generateVerificationCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (100000 + (array[0] % 900000)).toString();
}

/**
 * Hash a verification code using SHA-256
 */
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientIP = getClientIP(req);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const parseResult = await parseRequestBody(req, 10 * 1024);
    if (!parseResult.success) {
      return validationErrorResponse([parseResult.error!]);
    }
    const body = parseResult.data!;

    const validation = validateInput(body, resetValidationSchema);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { action, email, requestId, verificationCode, newPassword } =
      validation.sanitizedData as {
        action: string;
        email?: string;
        requestId?: string;
        verificationCode?: string;
        newPassword?: string;
      };

    // Rate limit check
    const rateLimit = await checkRateLimit(req, 'approve-password-reset', email || requestId);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    // ========================================
    // ACTION: INITIATE - Generate code, store hash, send email
    // ========================================
    if (action === 'initiate') {
      if (!email) {
        return validationErrorResponse(['email is required for initiate action']);
      }

      // Find user by email
      const { data: userId, error: lookupError } = await supabaseAdmin
        .rpc('check_user_exists_by_email', { user_email: email });

      if (lookupError || !userId) {
        // Don't reveal if email exists
        return new Response(
          JSON.stringify({ success: true, message: 'If the email exists, a verification code will be sent.' }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rate limit: max 3 pending requests per user per hour
      const { count } = await supabaseAdmin
        .from('password_reset_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString());

      if ((count || 0) >= 3) {
        return new Response(
          JSON.stringify({ error: 'Too many reset requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate verification code server-side
      const code = generateVerificationCode();
      const codeHash = await hashCode(code);

      // Store in database with 10-minute expiry
      const { data: resetRequest, error: insertError } = await supabaseAdmin
        .from('password_reset_requests')
        .insert({
          user_id: userId,
          status: 'pending',
          new_password_hash: 'pending', // placeholder, will be set during reset
          verification_code_hash: codeHash,
          code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to create reset request:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to initiate password reset' }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send verification email
      try {
        const gmailUser = Deno.env.get("GMAIL_USER");
        const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

        if (gmailUser && gmailAppPassword) {
          // Get username for email personalization
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();

          // Send via the verification email function
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-verification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              email,
              code,
              username: profile?.username || 'User',
            }),
          });

          if (!emailResponse.ok) {
            console.error('Failed to send verification email');
          }
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }

      // Log the initiation
      await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
        userId,
        action: 'password_reset_initiated',
        ipAddress: clientIP,
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return new Response(
        JSON.stringify({
          success: true,
          requestId: resetRequest.id,
          message: 'If the email exists, a verification code will be sent.',
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: VERIFY_AND_RESET - Verify code + reset password
    // ========================================
    if (action === 'verify_and_reset') {
      if (!requestId || !verificationCode || !newPassword) {
        return validationErrorResponse(['requestId, verificationCode, and newPassword are required']);
      }

      // Password strength validation
      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const weakPasswords = ['123456', 'password', 'qwerty', '111111', '123123'];
      if (weakPasswords.includes(newPassword.toLowerCase())) {
        return new Response(
          JSON.stringify({ error: "Password is too weak. Please choose a stronger password." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the pending reset request
      const { data: resetRequest, error: requestError } = await supabaseAdmin
        .from('password_reset_requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending')
        .maybeSingle();

      if (requestError || !resetRequest) {
        await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
          action: 'password_reset_invalid_request',
          ipAddress: clientIP,
          userAgent: req.headers.get('user-agent') || undefined,
          details: { requestId },
        });
        return new Response(
          JSON.stringify({ error: "Invalid or expired reset request" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check code expiry
      if (resetRequest.code_expires_at && new Date(resetRequest.code_expires_at) < new Date()) {
        // Expire the request
        await supabaseAdmin
          .from('password_reset_requests')
          .update({ status: 'expired', resolved_at: new Date().toISOString() })
          .eq('id', requestId);

        return new Response(
          JSON.stringify({ error: "Verification code has expired. Please request a new one." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the code hash
      const providedHash = await hashCode(verificationCode);
      if (providedHash !== resetRequest.verification_code_hash) {
        // Log failed attempt
        await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
          userId: resetRequest.user_id,
          action: 'password_reset_wrong_code',
          ipAddress: clientIP,
          userAgent: req.headers.get('user-agent') || undefined,
        });
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Code verified! Reset the password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        resetRequest.user_id,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark request as completed
      await supabaseAdmin
        .from('password_reset_requests')
        .update({ status: 'approved', resolved_at: new Date().toISOString() })
        .eq('id', requestId);

      await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
        userId: resetRequest.user_id,
        action: 'password_reset_success',
        ipAddress: clientIP,
        userAgent: req.headers.get('user-agent') || undefined,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Password reset successful" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: APPROVE/REJECT - Admin flow (requires JWT auth)
    // ========================================
    if (action === 'approve' || action === 'reject') {
      if (!requestId) {
        return validationErrorResponse(['requestId is required for approve/reject']);
      }

      // Require auth for admin actions
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "No authorization header" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !caller) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check admin role
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
        await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
          userId: caller.id,
          action: 'password_reset_unauthorized_attempt',
          ipAddress: clientIP,
          userAgent: req.headers.get('user-agent') || undefined,
        });
        return new Response(
          JSON.stringify({ error: "Only admins can approve password resets" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: request, error: requestError } = await supabaseAdmin
        .from("password_reset_requests")
        .select("*")
        .eq("id", requestId)
        .eq("status", "pending")
        .maybeSingle();

      if (requestError || !request) {
        return new Response(
          JSON.stringify({ error: "Request not found or already processed" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "approve" && request.new_password_hash && request.new_password_hash !== 'pending') {
        const legacyPassword = atob(request.new_password_hash);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          request.user_id,
          { password: legacyPassword }
        );

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update password" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      await supabaseAdmin
        .from("password_reset_requests")
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          resolved_at: new Date().toISOString(),
          admin_id: caller.id,
        })
        .eq("id", requestId);

      await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
        userId: request.user_id,
        action: `password_reset_${action}d_by_admin`,
        ipAddress: clientIP,
        details: { adminId: caller.id },
      });

      if (caller.id) {
        await supabaseAdmin.from("notifications").insert({
          user_id: request.user_id,
          actor_id: caller.id,
          type: `password_reset_${action}d`,
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: `Password reset ${action}d` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
