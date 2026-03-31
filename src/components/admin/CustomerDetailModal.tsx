import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, FileText, Users, Loader2 } from "lucide-react";

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

interface ContactPerson {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Document {
  id: string;
  file_name: string;
  file_url: string;
}

interface CustomerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerProfile | null;
  onSaved: () => void;
}

export function CustomerDetailModal({ open, onOpenChange, customer, onSaved }: CustomerDetailModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const ct = t.admin.customers;

  const [form, setForm] = useState<Partial<CustomerProfile>>({});
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);

  useEffect(() => {
    if (customer && open) {
      setForm({ ...customer });
      loadExtras(customer.user_id);
    }
  }, [customer, open]);

  const loadExtras = async (userId: string) => {
    setIsLoadingExtra(true);
    try {
      const [contactsRes, docsRes] = await Promise.all([
        supabase.from("contact_persons").select("id, name, phone, email").eq("user_id", userId).order("created_at"),
        supabase.from("business_documents").select("id, file_name, file_url").eq("user_id", userId).order("created_at"),
      ]);
      setContacts((contactsRes.data as ContactPerson[]) || []);
      setDocuments((docsRes.data as Document[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingExtra(false);
    }
  };

  const handleSave = async () => {
    if (!customer) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: form.company_name || null,
          contact_person: form.contact_person || null,
          contact_phone: form.contact_phone || null,
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          vat_id: form.vat_id || null,
          billing_street: form.billing_street || null,
          billing_city: form.billing_city || null,
          billing_zip: form.billing_zip || null,
          billing_country: form.billing_country || null,
          billing_email: form.billing_email || null,
          shipping_street: form.shipping_street || null,
          shipping_city: form.shipping_city || null,
          shipping_zip: form.shipping_zip || null,
          shipping_country: form.shipping_country || null,
          shipping_same_as_billing: form.shipping_same_as_billing ?? true,
          preferred_contact_method: form.preferred_contact_method || "email",
        })
        .eq("user_id", customer.user_id);

      if (error) throw error;

      toast({ title: ct.editSuccess, description: ct.editSuccessDesc });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: ct.editError, description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ct.details}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{ct.firstName}</Label>
              <Input value={form.first_name || ""} onChange={(e) => updateField("first_name", e.target.value)} />
            </div>
            <div>
              <Label>{ct.lastName}</Label>
              <Input value={form.last_name || ""} onChange={(e) => updateField("last_name", e.target.value)} />
            </div>
            <div>
              <Label>{ct.companyName}</Label>
              <Input value={form.company_name || ""} onChange={(e) => updateField("company_name", e.target.value)} />
            </div>
            <div>
              <Label>{ct.email}</Label>
              <Input value={form.email || ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label>{ct.contactPerson}</Label>
              <Input value={form.contact_person || ""} onChange={(e) => updateField("contact_person", e.target.value)} />
            </div>
            <div>
              <Label>{ct.contactPhone}</Label>
              <Input value={form.contact_phone || ""} onChange={(e) => updateField("contact_phone", e.target.value)} />
            </div>
            <div>
              <Label>{ct.vatId}</Label>
              <Input value={form.vat_id || ""} onChange={(e) => updateField("vat_id", e.target.value)} />
            </div>
            <div>
              <Label>{ct.preferredContact}</Label>
              <Select value={form.preferred_contact_method || "email"} onValueChange={(v) => updateField("preferred_contact_method", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-Mail</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Billing Address */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{ct.billingAddress}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>{ct.street}</Label>
                <Input value={form.billing_street || ""} onChange={(e) => updateField("billing_street", e.target.value)} />
              </div>
              <div>
                <Label>{ct.zip}</Label>
                <Input value={form.billing_zip || ""} onChange={(e) => updateField("billing_zip", e.target.value)} />
              </div>
              <div>
                <Label>{ct.city}</Label>
                <Input value={form.billing_city || ""} onChange={(e) => updateField("billing_city", e.target.value)} />
              </div>
              <div>
                <Label>{ct.country}</Label>
                <Input value={form.billing_country || ""} onChange={(e) => updateField("billing_country", e.target.value)} />
              </div>
              <div>
                <Label>{ct.billingEmail}</Label>
                <Input value={form.billing_email || ""} onChange={(e) => updateField("billing_email", e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Shipping Address */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold">{ct.shippingAddress}</h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.shipping_same_as_billing ?? true}
                  onCheckedChange={(checked) => updateField("shipping_same_as_billing", !!checked)}
                />
                <span className="text-xs text-muted-foreground">{ct.shippingSameAsBilling}</span>
              </div>
            </div>
            {!form.shipping_same_as_billing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{ct.street}</Label>
                  <Input value={form.shipping_street || ""} onChange={(e) => updateField("shipping_street", e.target.value)} />
                </div>
                <div>
                  <Label>{ct.zip}</Label>
                  <Input value={form.shipping_zip || ""} onChange={(e) => updateField("shipping_zip", e.target.value)} />
                </div>
                <div>
                  <Label>{ct.city}</Label>
                  <Input value={form.shipping_city || ""} onChange={(e) => updateField("shipping_city", e.target.value)} />
                </div>
                <div>
                  <Label>{ct.country}</Label>
                  <Input value={form.shipping_country || ""} onChange={(e) => updateField("shipping_country", e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Contact Persons */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {ct.contactPersons}
            </h3>
            {isLoadingExtra ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((cp) => (
                  <div key={cp.id} className="flex items-center gap-4 rounded-md border p-2 text-sm">
                    <span className="font-medium">{cp.name}</span>
                    {cp.email && <span className="text-muted-foreground">{cp.email}</span>}
                    {cp.phone && <span className="text-muted-foreground">{cp.phone}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Documents */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {ct.documents}
            </h3>
            {isLoadingExtra ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={async () => {
                      const { data } = await supabase.storage
                        .from("business-documents")
                        .createSignedUrl(doc.file_url, 3600);
                      if (data?.signedUrl) {
                        window.open(data.signedUrl, "_blank");
                      } else {
                        toast({ variant: "destructive", title: "Error", description: "Could not open document" });
                      }
                    }}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted transition-colors w-full text-left"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{doc.file_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{ct.profileCompleted}:</span>
            <Badge variant={form.profile_completed ? "default" : "secondary"}>
              {form.profile_completed ? ct.yes : ct.no}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {ct.close}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {ct.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
