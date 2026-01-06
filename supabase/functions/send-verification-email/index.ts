import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  code: string;
  username?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, username }: VerificationEmailRequest = await req.json();
    
    console.log(`Sending verification email to: ${email}`);

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailAppPassword) {
      console.error("Gmail credentials not configured");
      throw new Error("Email service not configured");
    }

    const client = new SmtpClient();

    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: gmailUser,
      password: gmailAppPassword,
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Novagram</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 400px; width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(139, 92, 246, 0.3);">
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <!-- Logo -->
                    <div style="margin-bottom: 30px;">
                      <span style="font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #8b5cf6, #d946ef, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">✨ Novagram</span>
                    </div>
                    
                    <!-- Welcome Text -->
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 10px 0; font-weight: 600;">
                      Welcome${username ? `, ${username}` : ''}! 👋
                    </h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 30px 0; line-height: 1.5;">
                      Enter this verification code to complete your signup
                    </p>
                    
                    <!-- Code Box -->
                    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2)); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace;">
                        ${code}
                      </div>
                    </div>
                    
                    <!-- Expiry Notice -->
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 20px 0;">
                      ⏱️ This code expires in 10 minutes
                    </p>
                    
                    <!-- Divider -->
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent); margin: 20px 0;"></div>
                    
                    <!-- Footer -->
                    <p style="color: #52525b; font-size: 11px; margin: 0; line-height: 1.6;">
                      If you didn't create an account on Novagram, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Bottom Text -->
              <p style="color: #3f3f46; font-size: 11px; margin-top: 20px;">
                © 2026 Novagram. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await client.send({
      from: gmailUser,
      to: email,
      subject: `${code} is your Novagram verification code`,
      content: "Your verification code is: " + code,
      html: htmlContent,
    });

    await client.close();

    console.log("Verification email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
