import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestItem {
  product_name: string;
  quantity: number;
}

interface Payload {
  requestId: string;
  userEmail: string;
  companyName?: string;
  contactPerson?: string;
  items: RequestItem[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload: Payload = await req.json();
    const { requestId, userEmail, companyName, contactPerson, items } = payload;

    const customerName = contactPerson || companyName || userEmail;
    const shortId = requestId.slice(0, 8).toUpperCase();

    const itemsHtml = items
      .map(
        (item) =>
          `<p style="margin: 0 0 4px; font-size: 15px; color: #333333;">${item.quantity}x ${item.product_name}</p>`
      )
      .join("");

    const baseUrl = "https://thie-b2b.lovable.app";

    const emailHtml = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Anfrage eingegangen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f0f0;">
<tr>
<td align="center" style="padding: 40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">

<!-- Header -->
<tr>
<td style="background: linear-gradient(135deg, #009c77 0%, #00b389 100%); padding: 32px 40px; text-align: center;">
<h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">Thie B2B Portal</h1>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding: 40px;">
<h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #1a1a1a;">Ihre Geräteanfrage ist eingegangen</h2>

<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #333333;">Hallo ${customerName},</p>

<p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #333333;">vielen Dank für Ihre Anfrage über unser B2B-Portal. Wir haben Ihre Bedarfsanmeldung für refurbished IT-Geräte erfolgreich erhalten und kümmern uns umgehend darum.</p>

<!-- Items Box -->
<div style="background-color: #f7faf9; border: 1px solid #e0ebe7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
<p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #009c77; text-transform: uppercase; letter-spacing: 0.5px;">Angefragte Hardware:</p>
${itemsHtml}
<hr style="border: none; border-top: 1px solid #e0ebe7; margin: 16px 0;">
<p style="margin: 0; font-size: 14px; color: #666666;">Anfragenummer: <strong style="color: #333333;">#${shortId}</strong></p>
</div>

<p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #333333;">Unser Team prüft aktuell die Verfügbarkeit in unserem Bestand. In Kürze erhalten Sie von uns eine Rückmeldung oder die Bestätigung zur Auslieferung. Gemeinsam geben wir dieser Technik ein zweites Leben und schonen wertvolle Ressourcen.</p>

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px;">
<tr>
<td style="border-radius: 8px; background-color: #009c77;">
<a href="${baseUrl}/requests" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">Anfragestatus im Portal ansehen</a>
</td>
</tr>
</table>

<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333333;">Mit nachhaltigen Grüßen,<br>Ihr Team der Thie GmbH</p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color: #f7f7f7; padding: 24px 40px; border-top: 1px solid #eeeeee;">
<p style="margin: 0 0 4px; font-size: 13px; color: #999999; text-align: center;">Thie GmbH</p>
<p style="margin: 0 0 4px; font-size: 13px; color: #999999; text-align: center;">Navarrastraße 15</p>
<p style="margin: 0 0 12px; font-size: 13px; color: #999999; text-align: center;">33106 Paderborn</p>
<p style="margin: 0 0 4px; font-size: 13px; color: #999999; text-align: center;">Telefon: 05251 5438 006</p>
<p style="margin: 0 0 12px; font-size: 13px; color: #999999; text-align: center;">E-Mail: <a href="mailto:kontakt@thie-eco.de" style="color: #009c77; text-decoration: none;">kontakt@thie-eco.de</a></p>
<p style="margin: 0; font-size: 12px; color: #bbbbbb; text-align: center;">
<a href="${baseUrl}/imprint" style="color: #bbbbbb; text-decoration: none;">Impressum</a> |
<a href="${baseUrl}/privacy" style="color: #bbbbbb; text-decoration: none;">Datenschutz</a>
</p>
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
      to: [userEmail],
      subject: `Ihre Geräteanfrage #${shortId} ist eingegangen`,
      html: emailHtml,
    });

    console.log("Confirmation email sent to:", userEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-request-confirmation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
