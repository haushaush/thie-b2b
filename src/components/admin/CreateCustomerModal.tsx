import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateCustomerModal({ open, onOpenChange, onCreated }: CreateCustomerModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "",
    contactPerson: "",
    contactPhone: "",
  });

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.companyName || !form.contactPerson) {
      toast({ variant: "destructive", title: t.common.error, description: "Bitte alle Pflichtfelder ausfüllen." });
      return;
    }
    if (form.password.length < 6) {
      toast({ variant: "destructive", title: t.common.error, description: "Passwort muss mindestens 6 Zeichen haben." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-customer", {
        body: form,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: t.admin.customers?.createSuccess || "Kunde erstellt", description: t.admin.customers?.createSuccessDesc || "Der Kunde wurde erfolgreich angelegt." });
      setForm({ email: "", password: "", companyName: "", contactPerson: "", contactPhone: "" });
      onOpenChange(false);
      onCreated();
    } catch (error: any) {
      toast({ variant: "destructive", title: t.common.error, description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t.admin.customers?.createTitle || "Kunde anlegen"}
          </DialogTitle>
          <DialogDescription>
            {t.admin.customers?.createDesc || "Legen Sie einen neuen Kunden mit Zugangsdaten an."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t.admin.customers?.companyName || "Firmenname"} *</Label>
            <Input value={form.companyName} onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Firma GmbH" />
          </div>
          <div className="space-y-2">
            <Label>{t.admin.customers?.contactPerson || "Ansprechpartner"} *</Label>
            <Input value={form.contactPerson} onChange={(e) => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Max Mustermann" />
          </div>
          <div className="space-y-2">
            <Label>{t.admin.customers?.contactPhone || "Telefon"}</Label>
            <Input value={form.contactPhone} onChange={(e) => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+49 123 456789" />
          </div>
          <div className="space-y-2">
            <Label>{t.profile.email} *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="kunde@firma.de" />
          </div>
          <div className="space-y-2">
            <Label>{t.auth.login.password} *</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mindestens 6 Zeichen" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.common.loading}</> : (t.admin.customers?.create || "Kunde anlegen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
