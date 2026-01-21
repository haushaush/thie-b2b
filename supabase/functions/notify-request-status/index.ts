import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyStatusPayload {
  requestId: string;
  userEmail: string;
  companyName?: string;
  status: "approved" | "rejected";
  adminMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotifyStatusPayload = await req.json();
    const { requestId, userEmail, companyName, status, adminMessage } = payload;

    console.log("Processing request status notification:", { requestId, userEmail, status });

    const isApproved = status === "approved";
    const statusText = isApproved ? "genehmigt" : "abgelehnt";
    const statusColor = isApproved ? "#22c55e" : "#ef4444";
    const statusEmoji = isApproved ? "✅" : "❌";

    const baseUrl = "https://thie-b2b.lovable.app";

    const emailResult = await resend.emails.send({
      from: "THIE B2B <onboarding@resend.dev>",
      to: [userEmail],
      subject: `${statusEmoji} Ihre Anfrage wurde ${statusText}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 20px;">
            Ihre Anfrage wurde ${statusText}
          </h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hallo${companyName ? ` ${companyName}` : ""},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Ihre Geräteanfrage (ID: ${requestId.slice(0, 8)}...) wurde 
            <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>.
          </p>

          ${adminMessage ? `
            <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">Nachricht vom Admin:</p>
              <p style="margin: 0; color: #666;">${adminMessage}</p>
            </div>
          ` : ""}

          ${isApproved ? `
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Wir werden uns in Kürze mit Ihnen in Verbindung setzen, um die weiteren Schritte zu besprechen.
            </p>
          ` : `
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Falls Sie Fragen haben oder eine neue Anfrage stellen möchten, besuchen Sie bitte unser Portal.
            </p>
          `}

          <div style="margin: 30px 0;">
            <a href="${baseUrl}/requests" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Anfragen ansehen
            </a>
          </div>

          <p style="color: #999; font-size: 14px;">
            Mit freundlichen Grüßen,<br>
            Das THIE Team
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, result: emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-request-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
