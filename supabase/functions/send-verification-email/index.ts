import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
                    <div style="margin-bottom: 30px;">
                      <span style="font-size: 32px; font-weight: bold; color: #8b5cf6;">✨ Novagram</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 10px 0; font-weight: 600;">
                      Welcome${username ? `, ${username}` : ''}! 👋
                    </h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 30px 0; line-height: 1.5;">
                      Enter this verification code to complete your signup
                    </p>
                    <div style="background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace;">
                        ${code}
                      </div>
                    </div>
                    <p style="color: #71717a; font-size: 12px; margin: 0 0 20px 0;">
                      ⏱️ This code expires in 10 minutes
                    </p>
                    <div style="height: 1px; background: rgba(139, 92, 246, 0.3); margin: 20px 0;"></div>
                    <p style="color: #52525b; font-size: 11px; margin: 0; line-height: 1.6;">
                      If you didn't create an account on Novagram, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="color: #3f3f46; font-size: 11px; margin-top: 20px;">
                © 2026 Novagram. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Use Gmail SMTP via raw socket connection
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const conn = await Deno.connectTls({
      hostname: "smtp.gmail.com",
      port: 465,
    });

    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      if (n === null) return "";
      return decoder.decode(buffer.subarray(0, n));
    };

    const sendCommand = async (cmd: string): Promise<string> => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await readResponse();
    };

    // Read initial greeting
    await readResponse();

    // EHLO
    await sendCommand(`EHLO smtp.gmail.com`);

    // AUTH LOGIN
    await sendCommand("AUTH LOGIN");
    await sendCommand(btoa(gmailUser));
    const authResponse = await sendCommand(btoa(gmailAppPassword));
    
    if (!authResponse.startsWith("235")) {
      throw new Error("SMTP authentication failed");
    }

    // MAIL FROM
    await sendCommand(`MAIL FROM:<${gmailUser}>`);

    // RCPT TO
    await sendCommand(`RCPT TO:<${email}>`);

    // DATA
    await sendCommand("DATA");

    // Send email content
    const boundary = "----=_Part_" + Math.random().toString(36).substring(2);
    const emailMessage = [
      `From: "Novagram" <${gmailUser}>`,
      `To: ${email}`,
      `Subject: ${code} is your Novagram verification code`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      `Your verification code is: ${code}`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      htmlContent,
      ``,
      `--${boundary}--`,
      `.`,
    ].join("\r\n");

    const finalResponse = await sendCommand(emailMessage);
    
    // QUIT
    await sendCommand("QUIT");
    conn.close();

    if (!finalResponse.startsWith("250")) {
      throw new Error("Failed to send email");
    }

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
