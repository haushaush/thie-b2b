import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductInfo {
  name: string;
  quantity: number;
  grade?: string;
}

interface NotifyNewProductsRequest {
  productCount: number;
  products?: ProductInfo[];
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

    const { productCount, products }: NotifyNewProductsRequest = await req.json();

    // Fetch all user profiles using service role
    const { data: profiles, error: profilesError } = await supabaseService.from("profiles").select("email, company_name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log("No profiles found to notify");
      return new Response(JSON.stringify({ success: true, message: "No users to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending notification to ${profiles.length} users about ${productCount} new products`);

    const baseUrl = "https://thie-b2b.lovable.app";

    // Build product list HTML
    const productListHtml = products && products.length > 0
      ? products.slice(0, 10).map(p => 
          `<p style="margin: 0 0 8px 0; color: #555555;">${p.quantity}x ${p.name}${p.grade ? ` (Zustand: ${p.grade})` : ""}</p>`
        ).join("\n")
      : `<p style="margin: 0; color: #555555;">${productCount} neue Geräte verfügbar</p>`;

    // Send emails to all users
    const emailPromises = profiles.map(async (profile) => {
      try {
        const emailHtml = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Neue Geräte - Thie B2B Portal</title>
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
<h2 style="color: #009c77; font-size: 20px; margin-top: 0;">Frische refurbished Hardware auf Lager!</h2>

<p style="margin: 0 0 15px 0;">Hallo${profile.company_name ? ` ${profile.company_name}` : ""},</p>

<p style="margin: 0 0 15px 0;">wir haben soeben unseren Bestand im B2B-Portal für Sie aufgefüllt. Ab sofort stehen Ihnen wieder neue, hochwertig aufbereitete IT-Geräte zur Verfügung.</p>

<div style="background-color: #f9f9f9; border-left: 4px solid #009c77; padding: 15px; margin-bottom: 20px;">
<p style="margin: 0 0 10px 0;"><strong>Neu eingetroffen:</strong></p>
${productListHtml}
<div style="margin-top: 15px; background-color: #e8f5e9; padding: 10px; border-radius: 4px;">
<p style="margin: 0; font-size: 14px; color: #555555;"><strong>Tipp:</strong> Schnell sein lohnt sich. Die Vergabe erfolgt nach Bestelleingang im Portal.</p>
</div>
</div>

<p style="margin: 0 0 25px 0;">Loggen Sie sich ein, um die genauen Spezifikationen der Geräte zu sehen und direkt eine neue Bedarfsanfrage für Ihr Unternehmen zu stellen.</p>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td align="center">
<a href="${baseUrl}/dashboard" style="background-color: #009c77; color: #ffffff; text-decoration: none; padding: 14px 25px; border-radius: 4px; font-weight: bold; display: inline-block;">Jetzt Bestand im Portal prüfen</a>
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
<p style="margin: 0 0 10px 0;">
<a href="${baseUrl}/imprint" style="color: #009c77; text-decoration: none;">Impressum</a> |
<a href="${baseUrl}/privacy" style="color: #009c77; text-decoration: none;">Datenschutz</a>
</p>
<p style="margin: 0; font-size: 12px;">Sie erhalten diese E-Mail, da Sie Benachrichtigungen für neue Geräte im Thie B2B-Portal aktiviert haben.</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;

        await resend.emails.send({
          from: "THIE B2B <onboarding@updates.haushhaush.de>",
          to: [profile.email],
          subject: "🆕 Frische refurbished Hardware auf Lager!",
          html: emailHtml,
        });
        console.log("Email sent successfully");
        return { success: true };
      } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(`Successfully sent ${successCount}/${profiles.length} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notified ${successCount} users`,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error in notify-new-products function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
