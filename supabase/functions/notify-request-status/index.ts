import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    // ============ AUTHENTICATION CHECK - ADMIN ONLY ============
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's JWT to validate authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid JWT token:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Check if user is admin using service role client
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roles, error: rolesError } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Error checking user roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      console.error("User is not an admin:", userId);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin verified:", userId);
    // ============ END AUTHENTICATION CHECK ============

    const payload: NotifyStatusPayload = await req.json();
    const { requestId, userEmail, companyName, status, adminMessage } = payload;

    console.log("Processing request status notification:", { requestId, userEmail, status });

    const isApproved = status === "approved";
    const statusText = isApproved ? "Genehmigt ✅" : "Abgelehnt ❌";
    const statusColor = isApproved ? "#28a745" : "#dc3545";
    const statusEmoji = isApproved ? "✅" : "❌";

    const baseUrl = "https://thie-b2b.lovable.app";

    const messageBlock = adminMessage
      ? `<p style="margin: 10px 0 0 0; font-style: italic; color: #555555;">"${adminMessage}"</p>`
      : "";

    const messageSection = adminMessage
      ? `<p style="margin: 15px 0 0 0; font-size: 14px;"><strong>Nachricht unseres Teams:</strong></p>${messageBlock}`
      : "";

    const emailHtml = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Statusupdate - Thie B2B Portal</title>
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; font-family: Arial, Helvetica, sans-serif; background-color: #f4f7f6; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6; padding: 20px 0;">
<tr>
<td align="center">
<table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

<tr>
<td align="center" style="background-color: #009c77; padding: 30px 20px;">
<h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: bold;">Thie B2B Portal</h1>
</td>
</tr>

<tr>
<td style="padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 16px;">
<h2 style="color: #009c77; font-size: 20px; margin-top: 0;">Statusupdate zu Ihrer Anfrage</h2>

<p style="margin: 0 0 15px 0;">Hallo${companyName ? ` ${companyName}` : ""},</p>

<p style="margin: 0 0 15px 0;">unser Team hat Ihre aktuelle Anfrage (Nummer: #${requestId.slice(0, 8)}) für refurbished Hardware geprüft. Es gibt Neuigkeiten zum Bearbeitungsstatus:</p>

<div style="background-color: #f9f9f9; border-left: 4px solid ${statusColor}; padding: 15px; margin-bottom: 20px;">
<p style="margin: 0; font-size: 15px;">
<strong>Aktueller Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
</p>
${messageSection}
</div>

<p style="margin: 0 0 25px 0;">Alle weiteren Details, wie z. B. angepasste Stückzahlen, mögliche Alternativgeräte oder die nächsten Schritte zur Auslieferung, finden Sie direkt in unserem B2B-Portal. Bei Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.</p>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td align="center">
<a href="${baseUrl}/requests" style="background-color: #009c77; color: #ffffff; text-decoration: none; padding: 14px 25px; border-radius: 4px; font-weight: bold; display: inline-block;">Details im Portal ansehen</a>
</td>
</tr>
</table>

<p style="margin: 25px 0 0 0;">Mit nachhaltigen Grüßen,<br>Ihr Team der Thie GmbH</p>
</td>
</tr>

<tr>
<td style="background-color: #eeeeee; padding: 25px 30px; color: #777777; font-size: 13px; text-align: center; line-height: 1.5;">
<p style="margin: 0 0 5px 0;">Thie GmbH</p>
<p style="margin: 0 0 5px 0;">Navarrastraße 15</p>
<p style="margin: 0 0 10px 0;">33106 Paderborn</p>
<p style="margin: 0 0 5px 0;">Telefon: 05251 5438 006</p>
<p style="margin: 0 0 10px 0;">E-Mail: <a href="mailto:kontakt@thie-eco.de" style="color: #009c77; text-decoration: none;">kontakt@thie-eco.de</a></p>
<p style="margin: 0;">
<a href="${baseUrl}/imprint" style="color: #009c77; text-decoration: none;">Impressum</a> |
<a href="${baseUrl}/privacy" style="color: #009c77; text-decoration: none;">Datenschutz</a>
</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;

    const emailResult = await resend.emails.send({
      from: "THIE B2B <onboarding@updates.haushhaush.de>",
      to: [userEmail],
      subject: `${statusEmoji} Statusupdate zu Ihrer Anfrage #${requestId.slice(0, 8)}`,
      html: emailHtml,
    });

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-request-status function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
