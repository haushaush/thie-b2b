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
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price_per_unit.toFixed(2)} €</td>
      </tr>
    `,
      )
      .join("");

    const baseUrl = "https://thie-b2b.lovable.app";

    // Send emails to all admins - don't expose email addresses in response
    const emailPromises = adminProfiles.map(async (admin) => {
      try {
        await resend.emails.send({
          from: "THIE B2B <onboarding@updates.haushhaush.de>",
          to: [admin.email],
          subject: `Neue Geräteanfrage von ${companyName || userEmail}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; margin-bottom: 20px;">Neue Geräteanfrage eingegangen</h1>
              
              <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0;"><strong>Kunde:</strong> ${companyName || "N/A"}</p>
                <p style="margin: 0 0 8px 0;"><strong>E-Mail:</strong> ${userEmail}</p>
                <p style="margin: 0;"><strong>Anfrage-ID:</strong> ${requestId.slice(0, 8)}...</p>
              </div>

              <h2 style="color: #333; font-size: 18px; margin-bottom: 12px;">Bestellte Geräte</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 8px; text-align: left;">Produkt</th>
                    <th style="padding: 8px; text-align: center;">Anzahl</th>
                    <th style="padding: 8px; text-align: right;">Preis/Stück</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="font-weight: bold; background-color: #f9f9f9;">
                    <td style="padding: 12px 8px;">Gesamt</td>
                    <td style="padding: 12px 8px; text-align: center;">${totalDevices} Geräte</td>
                    <td style="padding: 12px 8px; text-align: right;">${totalAmount.toFixed(2)} €</td>
                  </tr>
                </tfoot>
              </table>

              <div style="margin: 30px 0;">
                <a href="${baseUrl}/requests" 
                   style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
                  Anfragen verwalten
                </a>
              </div>

              <p style="color: #999; font-size: 14px;">
                Diese Nachricht wurde automatisch generiert.
              </p>
            </div>
          `,
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
