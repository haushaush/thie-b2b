import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { CustomersTab } from "@/components/admin/CustomersTab";

export default function Customers() {
  const { t } = useLanguage();

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = (adminRoles || []).map((r) => r.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, company_name, contact_person, contact_phone")
        .order("company_name");
      if (error) throw error;
      return (data || []).filter((p) => !adminIds.includes(p.user_id));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.admin.customers.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.admin.customers.createDesc}</p>
      </div>
      <CustomersTab customers={customers} isLoading={isLoading} onRefetch={() => refetch()} />
    </div>
  );
}
