import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { requestId, action, skipAdminCheck } = await req.json();

    if (!requestId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing requestId or action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If skipAdminCheck is not set, verify admin status
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

      // Check if caller is admin
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
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
      // Decode the password hash (base64 encoded in the forgot password flow)
      const newPassword = atob(request.new_password_hash);

      // Update the user's password using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        request.user_id,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password: " + updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the request status
      await supabaseAdmin
        .from("password_reset_requests")
        .update({
          status: "approved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      // Create notification for the user only if not self-service reset
      if (!skipAdminCheck) {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "");
        if (token) {
          const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
          if (caller) {
            await supabaseAdmin.from("notifications").insert({
              user_id: request.user_id,
              actor_id: caller.id,
              type: "password_reset_approved",
            });
          }
        }
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
        })
        .eq("id", requestId);

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
