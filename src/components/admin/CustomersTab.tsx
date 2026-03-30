import { useState } from "react";
import { Search, UserPlus, Eye, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { CustomerDetailModal } from "./CustomerDetailModal";

interface CustomerProfile {
  user_id: string;
  email: string;
  company_name: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  first_name: string | null;
  last_name: string | null;
  vat_id: string | null;
  billing_street: string | null;
  billing_city: string | null;
  billing_zip: string | null;
  billing_country: string | null;
  billing_email: string | null;
  shipping_street: string | null;
  shipping_city: string | null;
  shipping_zip: string | null;
  shipping_country: string | null;
  shipping_same_as_billing: boolean | null;
  preferred_contact_method: string | null;
  profile_completed: boolean | null;
}

interface CustomersTabProps {
  customers: CustomerProfile[];
  isLoading: boolean;
  onRefetch: () => void;
}

export function CustomersTab({ customers, isLoading, onRefetch }: CustomersTabProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.company_name || "").toLowerCase().includes(q) ||
      (c.contact_person || "").toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.contact_phone || "").toLowerCase().includes(q)
    );
  });

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
                    <TableHead className="font-semibold">{t.admin.customers.profileCompleted}</TableHead>
                    <TableHead className="font-semibold w-[80px]">{t.admin.products.table.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => (
                    <TableRow
                      key={customer.user_id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <TableCell className="font-medium">{customer.company_name || "-"}</TableCell>
                      <TableCell>{customer.contact_person || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                      <TableCell>{customer.contact_phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={customer.profile_completed ? "default" : "secondary"}>
                          {customer.profile_completed ? t.admin.customers.yes : t.admin.customers.no}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      <CustomerDetailModal
        open={!!selectedCustomer}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSaved={onRefetch}
      />
    </>
  );
}
