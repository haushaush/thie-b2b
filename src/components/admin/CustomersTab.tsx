import { useState } from "react";
import { Search, UserPlus, Pencil, X, Check, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateCustomerModal } from "./CreateCustomerModal";

interface CustomerProfile {
  user_id: string;
  email: string;
  company_name: string | null;
  contact_person: string | null;
  contact_phone: string | null;
}

interface CustomersTabProps {
  customers: CustomerProfile[];
  isLoading: boolean;
  onRefetch: () => void;
}

export function CustomersTab({ customers, isLoading, onRefetch }: CustomersTabProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomerProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.company_name || "").toLowerCase().includes(q) ||
      (c.contact_person || "").toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.contact_phone || "").toLowerCase().includes(q)
    );
  });

  const startEdit = (customer: CustomerProfile) => {
    setEditingId(customer.user_id);
    setEditForm({
      company_name: customer.company_name,
      contact_person: customer.contact_person,
      contact_phone: customer.contact_phone,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (userId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: editForm.company_name || null,
          contact_person: editForm.contact_person || null,
          contact_phone: editForm.contact_phone || null,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: t.admin.customers.editSuccess,
        description: t.admin.customers.editSuccessDesc,
      });
      setEditingId(null);
      setEditForm({});
      onRefetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.admin.customers.editError,
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t.admin.customers.title}
              </CardTitle>
              <CardDescription>
                {customers.length} {t.admin.customers.title}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateCustomer(true)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {t.admin.customers.create}
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.admin.customers.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              {t.common.loading}...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">
                {search ? t.dashboard.noResults : t.admin.customers.noCustomers}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {search ? t.dashboard.noResultsDesc : t.admin.customers.noCustomersDesc}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">{t.admin.customers.companyName}</TableHead>
                    <TableHead className="font-semibold">{t.admin.customers.contactPerson}</TableHead>
                    <TableHead className="font-semibold">{t.admin.customers.email}</TableHead>
                    <TableHead className="font-semibold">{t.admin.customers.contactPhone}</TableHead>
                    <TableHead className="font-semibold w-[100px]">{t.admin.products.table.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => (
                    <TableRow key={customer.user_id}>
                      <TableCell>
                        {editingId === customer.user_id ? (
                          <Input
                            value={editForm.company_name || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, company_name: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{customer.company_name || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === customer.user_id ? (
                          <Input
                            value={editForm.contact_person || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, contact_person: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          customer.contact_person || "-"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                      <TableCell>
                        {editingId === customer.user_id ? (
                          <Input
                            value={editForm.contact_phone || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, contact_phone: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          customer.contact_phone || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === customer.user_id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              onClick={() => saveEdit(customer.user_id)}
                              disabled={isSaving}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                              onClick={cancelEdit}
                              disabled={isSaving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => startEdit(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCustomerModal
        open={showCreateCustomer}
        onOpenChange={setShowCreateCustomer}
        onCreated={onRefetch}
      />
    </>
  );
}
