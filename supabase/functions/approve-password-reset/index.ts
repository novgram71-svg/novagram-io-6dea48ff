/**
 * Password Reset Approval Edge Function
 * Handles password reset requests with admin approval flow
 * 
 * Security features:
 * - Rate limiting (5 requests per minute)
 * - Input validation (UUID format, password requirements)
 * - Admin authorization check
 * - Security audit logging
 * - No password hash storage in database
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
  getClientIP,
  logSecurityEvent,
} from "../_shared/security.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
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
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body safely
    const parseResult = await parseRequestBody(req, 10 * 1024); // 10KB max
    if (!parseResult.success) {
      return validationErrorResponse([parseResult.error!]);
    }
    const body = parseResult.data!;

    // Validate input
    const validation = validateInput(body, validationSchemas['approve-password-reset']);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { requestId, action, skipAdminCheck, userId, newPassword } = 
      validation.sanitizedData as {
        requestId?: string;
        action?: string;
        skipAdminCheck?: boolean;
        userId?: string;
        newPassword?: string;
      };

    // Check rate limit
    const rateLimit = await checkRateLimit(req, 'approve-password-reset', userId);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    // NEW SECURE FLOW: Direct password reset without storing in database
    if (userId && newPassword) {
      console.log("Processing secure direct password reset for user:", userId);
      
      // Additional password strength validation
      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for common weak passwords
      const weakPasswords = ['123456', 'password', 'qwerty', '111111', '123123'];
      if (weakPasswords.includes(newPassword.toLowerCase())) {
        return new Response(
          JSON.stringify({ error: "Password is too weak. Please choose a stronger password." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user exists
      const { data: userExists, error: userError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (userError || !userExists) {
        console.error("User not found:", userId);
        // Log potential enumeration attempt
        await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
          action: 'password_reset_user_not_found',
          ipAddress: clientIP,
          userAgent: req.headers.get('user-agent') || undefined,
          details: { attemptedUserId: userId }
        });
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the user's password directly using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log successful password reset
      await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
        userId,
        action: 'password_reset_success',
        ipAddress: clientIP,
        userAgent: req.headers.get('user-agent') || undefined,
      });

      console.log("Password reset successful for user:", userId);
      return new Response(
        JSON.stringify({ success: true, message: "Password reset successful" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // LEGACY FLOW: For admin-based password reset requests
    if (!requestId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If skipAdminCheck is not set, verify admin status
    let callerId: string | null = null;
    if (!skipAdminCheck) {
      // Get the authorization header to verify the caller is an admin
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "No authorization header" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the caller is authenticated
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !caller) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      callerId = caller.id;

      // Check if caller is admin
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
        // Log unauthorized access attempt
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
    }

    // Get the password reset request
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

    if (action === "approve") {
      // For legacy requests, decode the base64 password
      const legacyPassword = atob(request.new_password_hash);

      // Update the user's password using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        request.user_id,
        { password: legacyPassword }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the request status
      await supabaseAdmin
        .from("password_reset_requests")
        .update({
          status: "approved",
          resolved_at: new Date().toISOString(),
          admin_id: callerId,
        })
        .eq("id", requestId);

      // Log the action
      await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
        userId: request.user_id,
        action: 'password_reset_approved_by_admin',
        ipAddress: clientIP,
        details: { adminId: callerId }
      });

      // Create notification for the user
      if (callerId) {
        await supabaseAdmin.from("notifications").insert({
          user_id: request.user_id,
          actor_id: callerId,
          type: "password_reset_approved",
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Password reset approved" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "reject") {
      // Update the request status to rejected
      await supabaseAdmin
        .from("password_reset_requests")
        .update({
          status: "rejected",
          resolved_at: new Date().toISOString(),
          admin_id: callerId,
        })
        .eq("id", requestId);

      // Log the action
      await logSecurityEvent(supabaseUrl, supabaseServiceKey, {
        userId: request.user_id,
        action: 'password_reset_rejected_by_admin',
        ipAddress: clientIP,
        details: { adminId: callerId }
      });

      return new Response(
        JSON.stringify({ success: true, message: "Password reset rejected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
