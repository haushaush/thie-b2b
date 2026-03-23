import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Upload, X, Loader2, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const EU_COUNTRIES = [
  "Deutschland", "Österreich", "Belgien", "Bulgarien", "Kroatien", "Zypern",
  "Tschechien", "Dänemark", "Estland", "Finnland", "Frankreich", "Griechenland",
  "Ungarn", "Irland", "Italien", "Lettland", "Litauen", "Luxemburg", "Malta",
  "Niederlande", "Polen", "Portugal", "Rumänien", "Slowakei", "Slowenien",
  "Spanien", "Schweden",
];

const ALL_COUNTRIES = [
  ...EU_COUNTRIES,
  "Schweiz", "Vereinigtes Königreich", "Norwegen", "USA", "Kanada", "Türkei", "Andere",
].sort();

interface ContactPerson {
  id?: string;
  name: string;
  phone: string;
  email: string;
}

interface UploadedDoc {
  id?: string;
  file_name: string;
  file_url: string;
}

export default function CompleteProfile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cp = (t as any).completeProfile || {};

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Contact persons
  const [contacts, setContacts] = useState<ContactPerson[]>([
    { name: "", phone: "", email: "" },
  ]);

  // Preferred contact method
  const [preferredContact, setPreferredContact] = useState("email");

  // Billing address
  const [billing, setBilling] = useState({
    street: "",
    city: "",
    zip: "",
    country: "",
    email: "",
  });

  // Shipping
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shipping, setShipping] = useState({
    street: "",
    city: "",
    zip: "",
    country: "",
  });

  // VAT
  const [vatId, setVatId] = useState("");

  // Documents
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  const showVatField = EU_COUNTRIES.includes(billing.country);

  const addContact = () => {
    setContacts((prev) => [...prev, { name: "", phone: "", email: "" }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length <= 1) return;
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ContactPerson, value: string) => {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: Max. 10MB`);
          continue;
        }

        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("business-documents")
          .upload(fileName, file);

        if (uploadError) {
          toast.error(`${t.common.error}: ${file.name}`);
          continue;
        }

        // Save reference in DB
        const { data, error: dbError } = await supabase
          .from("business_documents")
          .insert({ user_id: user.id, file_name: file.name, file_url: fileName })
          .select()
          .single();

        if (!dbError && data) {
          setDocuments((prev) => [...prev, { id: data.id, file_name: file.name, file_url: fileName }]);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeDocument = async (doc: UploadedDoc) => {
    await supabase.storage.from("business-documents").remove([doc.file_url]);
    if (doc.id) {
      await supabase.from("business_documents").delete().eq("id", doc.id);
    }
    setDocuments((prev) => prev.filter((d) => d.file_url !== doc.file_url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate at least one contact with name
    const validContacts = contacts.filter((c) => c.name.trim());
    if (validContacts.length === 0) {
      toast.error(cp.errorMinContact || "Please add at least one contact person.");
      return;
    }

    if (!billing.street || !billing.city || !billing.zip || !billing.country) {
      toast.error(cp.errorBillingAddress || "Please fill in the billing address.");
      return;
    }

    if (!shippingSameAsBilling && (!shipping.street || !shipping.city || !shipping.zip || !shipping.country)) {
      toast.error(cp.errorShippingAddress || "Please fill in the shipping address.");
      return;
    }

    setIsSaving(true);

    try {
      // Save contact persons
      for (const contact of validContacts) {
        await supabase.from("contact_persons").insert({
          user_id: user.id,
          name: contact.name.trim(),
          phone: contact.phone.trim() || null,
          email: contact.email.trim() || null,
        });
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_contact_method: preferredContact,
          billing_street: billing.street,
          billing_city: billing.city,
          billing_zip: billing.zip,
          billing_country: billing.country,
          billing_email: billing.email || null,
          shipping_same_as_billing: shippingSameAsBilling,
          shipping_street: shippingSameAsBilling ? billing.street : shipping.street,
          shipping_city: shippingSameAsBilling ? billing.city : shipping.city,
          shipping_zip: shippingSameAsBilling ? billing.zip : shipping.zip,
          shipping_country: shippingSameAsBilling ? billing.country : shipping.country,
          vat_id: showVatField ? vatId || null : null,
          profile_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(cp.completed || "Profile completed!");
      // Reload to refresh auth context
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("Error completing profile:", error);
      toast.error(cp.errorSaving || "Error saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">T</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">{cp.title || "Complete Profile"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cp.description || "Please complete your company details to be able to place orders."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Persons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{cp.contactPersons || "Contact Persons"}</CardTitle>
              <CardDescription>{cp.contactPersonsDesc || "Add your contact persons."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {cp.contactPerson || "Contact Person"} {index + 1}
                    </span>
                    {contacts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{cp.name || "Name"} *</Label>
                      <Input
                        placeholder="Max Mustermann"
                        value={contact.name}
                        onChange={(e) => updateContact(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{cp.phone || "Phone"}</Label>
                      <Input
                        type="tel"
                        placeholder="+49 123 456789"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, "phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{cp.emailLabel || "Email"}</Label>
                      <Input
                        type="email"
                        placeholder="max@firma.de"
                        value={contact.email}
                        onChange={(e) => updateContact(index, "email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addContact}>
                <Plus className="mr-2 h-4 w-4" />
                {cp.addContact || "Add Contact Person"}
              </Button>
            </CardContent>
          </Card>

          {/* Preferred Contact Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{cp.preferredContact || "Preferred Contact Method"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={preferredContact} onValueChange={setPreferredContact}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-Mail</SelectItem>
                  <SelectItem value="phone">{cp.phone || "Phone"}</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{cp.billingAddress || "Billing Address"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{cp.street || "Street & Number"} *</Label>
                <Input
                  placeholder="Musterstraße 1"
                  value={billing.street}
                  onChange={(e) => setBilling((p) => ({ ...p, street: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{cp.zip || "Postal Code"} *</Label>
                  <Input
                    placeholder="12345"
                    value={billing.zip}
                    onChange={(e) => setBilling((p) => ({ ...p, zip: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{cp.city || "City"} *</Label>
                  <Input
                    placeholder="Berlin"
                    value={billing.city}
                    onChange={(e) => setBilling((p) => ({ ...p, city: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{cp.country || "Country"} *</Label>
                <Select value={billing.country} onValueChange={(v) => setBilling((p) => ({ ...p, country: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={cp.selectCountry || "Select country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{cp.billingEmailAlt || "Alternative email for invoices (optional)"}</Label>
                <Input
                  type="email"
                  placeholder="rechnung@firma.de"
                  value={billing.email}
                  onChange={(e) => setBilling((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{cp.shippingAddress || "Shipping Address"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sameAsBilling"
                  checked={shippingSameAsBilling}
                  onCheckedChange={(checked) => setShippingSameAsBilling(checked === true)}
                />
                <Label htmlFor="sameAsBilling" className="text-sm font-normal">
                  {cp.shippingSameAsBilling || "Shipping address is the same as billing address"}
                </Label>
              </div>

              {!shippingSameAsBilling && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>{cp.street || "Street & Number"} *</Label>
                    <Input
                      placeholder="Musterstraße 1"
                      value={shipping.street}
                      onChange={(e) => setShipping((p) => ({ ...p, street: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{cp.zip || "Postal Code"} *</Label>
                      <Input
                        placeholder="12345"
                        value={shipping.zip}
                        onChange={(e) => setShipping((p) => ({ ...p, zip: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{cp.city || "City"} *</Label>
                      <Input
                        placeholder="Berlin"
                        value={shipping.city}
                        onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{cp.country || "Country"} *</Label>
                    <Select value={shipping.country} onValueChange={(v) => setShipping((p) => ({ ...p, country: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={cp.selectCountry || "Select country"} />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VAT ID */}
          {showVatField && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{cp.vatId || "VAT ID"}</CardTitle>
                <CardDescription>{cp.vatIdDesc || "Required for EU companies"}</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="DE123456789"
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                />
              </CardContent>
            </Card>
          )}

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{cp.documents || "Upload Documents"}</CardTitle>
              <CardDescription>
                {cp.documentsDesc || "Upload proof such as business registration, trade register extract, etc."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <div
                    key={doc.file_url}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="max-w-[200px] truncate">{doc.file_name}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {cp.uploadDocuments || "Upload Documents"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleDocUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC – max. 10MB</p>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {cp.saving || "Saving..."}
                </>
              ) : (
                cp.save || "Save & Continue"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
