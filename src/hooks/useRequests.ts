import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RequestItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  storage?: string | null;
  color?: string | null;
  grade?: string | null;
  battery_health?: number | null;
}

export interface Request {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  admin_message: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  shipping_cost: number;
  express_shipping: boolean;
  items: RequestItem[];
  user_email?: string;
  company_name?: string;
}

export function useRequests() {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["requests", isAdmin],
    queryFn: async () => {
      // Fetch requests
      const { data: requests, error: requestsError } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      if (!requests || requests.length === 0) {
        return [];
      }

      // Fetch all request items
      const requestIds = requests.map((r) => r.id);
      const { data: items, error: itemsError } = await supabase
        .from("request_items")
        .select("*, products(storage, color, grade, battery_health)")
        .in("request_id", requestIds);

      if (itemsError) throw itemsError;

      // If admin, fetch user profiles to get email and company
      let profilesMap: Record<string, { email: string; company_name: string | null }> = {};
      
      if (isAdmin) {
        const userIds = [...new Set(requests.map((r) => r.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, email, company_name")
          .in("user_id", userIds);

        if (!profilesError && profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = { email: p.email, company_name: p.company_name };
            return acc;
          }, {} as Record<string, { email: string; company_name: string | null }>);
        }
      }

      // Map items to requests
      const requestsWithItems: Request[] = requests.map((request) => ({
        ...request,
        status: request.status as "pending" | "approved" | "rejected",
        shipping_cost: Number(request.shipping_cost),
        express_shipping: request.express_shipping,
        items: (items || [])
          .filter((item) => item.request_id === request.id)
          .map((item) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price_per_unit: Number(item.price_per_unit),
          })),
        user_email: profilesMap[request.user_id]?.email,
        company_name: profilesMap[request.user_id]?.company_name ?? undefined,
      }));

      return requestsWithItems;
    },
  });
}
