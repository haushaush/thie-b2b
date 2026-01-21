import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    console.log(`Sending test email to: ${email}`);

    const result = await resend.emails.send({
      from: "THIE B2B <onboarding@resend.dev>",
      to: [email],
      subject: "Test E-Mail - THIE B2B",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 20px;">Test E-Mail erfolgreich!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Diese Test-E-Mail bestätigt, dass das E-Mail-Benachrichtigungssystem korrekt funktioniert.
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Mit freundlichen Grüßen,<br>
            Das THIE Team
          </p>
        </div>
      `,
    });

    console.log("Test email sent:", result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
