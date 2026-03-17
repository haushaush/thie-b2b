import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  storage: string;
  color: string;
  batteryHealth: number;
  batteryType: string;
  grade: string;
  pricePerUnit: number;
  availableUnits: number;
  securedUnits: number;
}

export function useProducts() {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes on products table
  useEffect(() => {
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .gt("available_units", 0)
        .order("name");

      if (error) throw error;

      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        manufacturer: p.manufacturer,
        storage: p.storage || "",
        color: p.color || "",
        batteryHealth: p.battery_health || 0,
        batteryType: (p as any).battery_type || "",
        grade: p.grade || "A",
        pricePerUnit: Number(p.price_per_unit),
        availableUnits: p.available_units,
        securedUnits: 0,
      }));
    },
  });
}
