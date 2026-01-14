import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  storage: string;
  color: string;
  batteryHealth: number;
  grade: "A" | "B" | "C";
  pricePerUnit: number;
  availableUnits: number;
  securedUnits: number;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;

      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        manufacturer: p.manufacturer,
        storage: p.storage || "",
        color: p.color || "",
        batteryHealth: p.battery_health || 0,
        grade: (p.grade === "A" || p.grade === "B" || p.grade === "C" ? p.grade : "A") as "A" | "B" | "C",
        pricePerUnit: Number(p.price_per_unit),
        availableUnits: p.available_units,
        securedUnits: 0,
      }));
    },
  });
}
