import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fixed Thie notification recipients - update these as needed
const THIE_NOTIFICATION_EMAILS: string[] = [];

interface OrderItem {
  product_name: string;
  quantity: number;
  price_per_unit: number;
  storage?: string | null;
  color?: string | null;
  grade?: string | null;
  battery_health?: number | null;
  manufacturer?: string | null;
}

interface NotifyOrderPayload {
  requestId: string;
  companyName?: string;
  contactPerson?: string;
  items: OrderItem[];
  shippingCost: number;
  expressShipping: boolean;
  notificationEmails: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ AUTHENTICATION CHECK - ADMIN ONLY ============
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roles } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    // ============ END AUTHENTICATION CHECK ============

    const payload: NotifyOrderPayload = await req.json();
    const { requestId, companyName, contactPerson, items, shippingCost, expressShipping, notificationEmails } = payload;

    // Combine fixed emails with any passed notification emails
    const recipients = [...new Set([...THIE_NOTIFICATION_EMAILS, ...notificationEmails])].filter(Boolean);

    if (recipients.length === 0) {
      console.log("No notification recipients configured, skipping email");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price_per_unit, 0);
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const grandTotal = subtotal + shippingCost;

    const itemRows = items.map((item) => {
      const make = item.manufacturer || (item.product_name.includes("iPhone") || item.product_name.includes("iPad") ? "Apple" : "Samsung");
      return `<tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${make}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.product_name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.storage || "-"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.color || "-"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: center;">${item.battery_health ? item.battery_health + "%" : "-"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: center;">${item.grade || "-"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: right;">${item.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: right;">${item.price_per_unit.toFixed(2)} €</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: right; font-weight: bold;">${(item.quantity * item.price_per_unit).toFixed(2)} €</td>
      </tr>`;
    }).join("");

    const baseUrl = "https://thie-b2b.lovable.app";

    const emailHtml = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Neue genehmigte Bestellung - Thie B2B Portal</title>
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
body { margin: 0; padding: 0; width: 100% !important; font-family: Arial, Helvetica, sans-serif; background-color: #f4f7f6; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6; padding: 20px 0;">
<tr>
<td align="center">
<table border="0" cellpadding="0" cellspacing="0" width="700" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

<tr>
<td align="center" style="background-color: #009c77; padding: 30px 20px;">
<h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: bold;">Thie B2B Portal</h1>
<p style="color: #ffffff; font-size: 14px; margin: 10px 0 0 0; opacity: 0.9;">Neue genehmigte Bestellung</p>
</td>
</tr>

<tr>
<td style="padding: 30px; color: #333333; line-height: 1.6; font-size: 16px;">
<h2 style="color: #009c77; font-size: 20px; margin-top: 0;">Bestellung #${requestId.slice(0, 8).toUpperCase()}</h2>

<div style="background-color: #f0faf7; border-left: 4px solid #009c77; padding: 15px; margin-bottom: 20px;">
<p style="margin: 0; font-size: 14px;"><strong>Kunde:</strong> ${companyName || "Unbekannt"}</p>
${contactPerson ? `<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Ansprechpartner:</strong> ${contactPerson}</p>` : ""}
<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Versandart:</strong> ${expressShipping ? "Express" : "Standard"}</p>
</div>

<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
<tr style="background-color: #009c77;">
<th style="padding: 10px 12px; text-align: left; color: #ffffff; font-size: 13px;">Make</th>
<th style="padding: 10px 12px; text-align: left; color: #ffffff; font-size: 13px;">Model</th>
<th style="padding: 10px 12px; text-align: left; color: #ffffff; font-size: 13px;">Memory</th>
<th style="padding: 10px 12px; text-align: left; color: #ffffff; font-size: 13px;">Color</th>
<th style="padding: 10px 12px; text-align: center; color: #ffffff; font-size: 13px;">Battery</th>
<th style="padding: 10px 12px; text-align: center; color: #ffffff; font-size: 13px;">Grade</th>
<th style="padding: 10px 12px; text-align: right; color: #ffffff; font-size: 13px;">QTY</th>
<th style="padding: 10px 12px; text-align: right; color: #ffffff; font-size: 13px;">Price</th>
<th style="padding: 10px 12px; text-align: right; color: #ffffff; font-size: 13px;">Total</th>
</tr>
${itemRows}
<tr style="background-color: #f9f9f9; font-weight: bold;">
<td colspan="6" style="padding: 10px 12px; font-size: 14px;"></td>
<td style="padding: 10px 12px; text-align: right; font-size: 14px;">${totalQty}</td>
<td style="padding: 10px 12px; text-align: right; font-size: 14px;"></td>
<td style="padding: 10px 12px; text-align: right; font-size: 14px;">${subtotal.toFixed(2)} €</td>
</tr>
</table>

<div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size: 14px; padding: 3px 0;">Zwischensumme</td><td style="text-align: right; font-size: 14px; padding: 3px 0;">${subtotal.toFixed(2)} €</td></tr>
<tr><td style="font-size: 14px; padding: 3px 0;">Versand${expressShipping ? " (Express)" : ""}</td><td style="text-align: right; font-size: 14px; padding: 3px 0;">${shippingCost === 0 ? "Kostenlos" : shippingCost.toFixed(2) + " €"}</td></tr>
<tr><td style="font-size: 16px; padding: 8px 0 3px; font-weight: bold; border-top: 1px solid #ddd;">Gesamtbetrag</td><td style="text-align: right; font-size: 16px; padding: 8px 0 3px; font-weight: bold; border-top: 1px solid #ddd; color: #009c77;">${grandTotal.toFixed(2)} €</td></tr>
</table>
</div>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center">
<a href="${baseUrl}/orders" style="background-color: #009c77; color: #ffffff; text-decoration: none; padding: 14px 25px; border-radius: 4px; font-weight: bold; display: inline-block;">Im Portal ansehen</a>
</td></tr>
</table>
</td>
</tr>

<tr>
<td style="background-color: #eeeeee; padding: 25px 30px; color: #777777; font-size: 13px; text-align: center; line-height: 1.5;">
<p style="margin: 0 0 5px 0;">Thie GmbH</p>
<p style="margin: 0 0 5px 0;">Navarrastraße 15 · 33106 Paderborn</p>
<p style="margin: 0 0 5px 0;">Telefon: 05251 5438 006</p>
<p style="margin: 0;"><a href="mailto:kontakt@thie-eco.de" style="color: #009c77; text-decoration: none;">kontakt@thie-eco.de</a></p>
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
      to: recipients,
      subject: `📦 Neue genehmigte Bestellung #${requestId.slice(0, 8).toUpperCase()} – ${companyName || "Kunde"} – ${totalQty} Geräte`,
      html: emailHtml,
    });

    console.log("Order notification email sent to:", recipients, emailResult);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-order-approved:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
