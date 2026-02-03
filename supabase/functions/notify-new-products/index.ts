import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyNewProductsRequest {
  productCount: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productCount }: NotifyNewProductsRequest = await req.json();

    // Create Supabase client with service role to access all profiles
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("email, company_name");

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

    // Send emails to all users
    const emailPromises = profiles.map(async (profile) => {
      try {
        const result = await resend.emails.send({
          from: "THIE B2B <onboarding@updates.haushhaush.de>",
          to: [profile.email],
          subject: "Neue Produkte verfügbar!",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; margin-bottom: 20px;">Neue Produkte im Katalog!</h1>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Hallo${profile.company_name ? ` ${profile.company_name}` : ""},
              </p>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Wir haben <strong>${productCount} neue Produkte</strong> zu unserem Katalog hinzugefügt. 
                Schauen Sie sich die neuesten Angebote an!
              </p>
              <div style="margin: 30px 0;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/dashboard" 
                   style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Katalog ansehen
                </a>
              </div>
              <p style="color: #999; font-size: 14px;">
                Mit freundlichen Grüßen,<br>
                Das Thie Team
              </p>
            </div>
          `,
        });
        console.log(`Email sent to ${profile.email}:`, result);
        return { email: profile.email, success: true };
      } catch (error) {
        console.error(`Failed to send email to ${profile.email}:`, error);
        return { email: profile.email, success: false, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(`Successfully sent ${successCount}/${profiles.length} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notified ${successCount} users`,
        results,
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
