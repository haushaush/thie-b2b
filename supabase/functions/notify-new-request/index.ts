import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestItem {
  product_name: string;
  quantity: number;
  price_per_unit: number;
}

interface NotifyNewRequestPayload {
  requestId: string;
  userEmail: string;
  companyName?: string;
  items: RequestItem[];
  totalDevices: number;
  totalAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ AUTHENTICATION CHECK ============
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
    // ============ END AUTHENTICATION CHECK ============

    const payload: NotifyNewRequestPayload = await req.json();
    const { requestId, userEmail, companyName, items, totalDevices, totalAmount } = payload;

    console.log("Processing new request notification:", { requestId, userEmail, companyName });

    // Create Supabase client with service role to access admin users
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch admin profiles to get emails
    const adminUserIds = adminRoles.map((r) => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email")
      .in("user_id", adminUserIds);

    if (profilesError) {
      console.error("Error fetching admin profiles:", profilesError);
      throw profilesError;
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      console.log("No admin profiles found");
      return new Response(JSON.stringify({ success: true, message: "No admin profiles to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending request notification to ${adminProfiles.length} admins`);

    // Generate items HTML
    const itemsHtml = items
      .map(
        (item) =>
          `<li>${item.quantity}x ${item.product_name}</li>`
      )
      .join("");

    const baseUrl = "https://thie-b2b.lovable.app";
    const shortId = requestId.slice(0, 8).toUpperCase();

    const customerName = companyName || userEmail;

    const emailHtmlTemplate = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Neue Geräteanfrage - Thie B2B Portal</title>
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
<h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: bold;">Thie B2B Portal – Systeminfo</h1>
</td>
</tr>

<tr>
<td style="padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 16px;">
<h2 style="color: #009c77; font-size: 20px; margin-top: 0;">Neue Geräteanfrage eingegangen</h2>

<p style="margin: 0 0 15px 0;">Hallo Admin-Team,</p>

<p style="margin: 0 0 15px 0;">ein Kunde hat soeben eine neue Anfrage für refurbished Hardware über das B2B-Portal eingereicht. Bitte prüft die Bestände und bearbeitet die Anfrage zeitnah.</p>

<div style="background-color: #f9f9f9; border-left: 4px solid #009c77; padding: 15px; margin-bottom: 20px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 15px;">
<tr>
<td width="35%" style="padding-bottom: 8px; color: #777777;"><strong>Unternehmen:</strong></td>
<td width="65%" style="padding-bottom: 8px;">${customerName}</td>
</tr>
<tr>
<td style="padding-bottom: 8px; color: #777777;"><strong>Ansprechpartner:</strong></td>
<td style="padding-bottom: 8px;">${userEmail}</td>
</tr>
<tr>
<td style="padding-bottom: 15px; color: #777777;"><strong>Anfrage-ID:</strong></td>
<td style="padding-bottom: 15px;">#${shortId}</td>
</tr>
</table>

<p style="margin: 0 0 10px 0; border-top: 1px solid #eeeeee; padding-top: 15px;"><strong>Gewünschte Hardware:</strong></p>
<ul style="margin: 0; padding-left: 20px; color: #555555;">
${itemsHtml}
</ul>
</div>

<p style="margin: 0 0 25px 0;">Loggt euch ins System ein, um die Details einzusehen, Bestände zu matchen und dem Kunden eine Rückmeldung zu geben.</p>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td align="center">
<a href="${baseUrl}/requests" style="background-color: #009c77; color: #ffffff; text-decoration: none; padding: 14px 25px; border-radius: 4px; font-weight: bold; display: inline-block;">Anfrage im Portal bearbeiten</a>
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="background-color: #eeeeee; padding: 25px 30px; color: #777777; font-size: 13px; text-align: center; line-height: 1.5;">
<p style="margin: 0 0 10px 0;">Automatisch generierte Systemnachricht des Thie B2B Portals.</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;

    // Send emails to all admins
    const emailPromises = adminProfiles.map(async (admin) => {
      try {
        await resend.emails.send({
          from: "THIE B2B <onboarding@updates.haushhaush.de>",
          to: [admin.email],
          subject: `Neue Geräteanfrage #${shortId} von ${customerName}`,
          html: emailHtmlTemplate,
        });
        console.log("Email sent to admin successfully");
        return { success: true };
      } catch (error) {
        console.error("Failed to send email to admin:", error);
        return { success: false };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(`Successfully sent ${successCount}/${adminProfiles.length} admin notification emails`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notified ${successCount} admins`,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error in notify-new-request function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
