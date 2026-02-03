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
    const statusText = isApproved ? "genehmigt" : "abgelehnt";
    const statusColor = isApproved ? "#22c55e" : "#ef4444";
    const statusEmoji = isApproved ? "✅" : "❌";

    const baseUrl = "https://thie-b2b.lovable.app";

    const emailResult = await resend.emails.send({
      from: "THIE B2B <onboarding@updates.haushhaush.de>",
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

          ${
            adminMessage
              ? `
            <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">Nachricht vom Admin:</p>
              <p style="margin: 0; color: #666;">${adminMessage}</p>
            </div>
          `
              : ""
          }

          ${
            isApproved
              ? `
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Wir werden uns in Kürze mit Ihnen in Verbindung setzen, um die weiteren Schritte zu besprechen.
            </p>
          `
              : `
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Falls Sie Fragen haben oder eine neue Anfrage stellen möchten, besuchen Sie bitte unser Portal.
            </p>
          `
          }

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
