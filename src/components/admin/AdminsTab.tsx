import { useState } from "react";
import { Search, Shield, ShieldPlus, Pencil, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AdminProfile {
  user_id: string;
  email: string;
  company_name: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  first_name: string | null;
  last_name: string | null;
}

export function AdminsTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "",
    contactPerson: "",
    contactPhone: "",
  });

  const { data: admins = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-admins"],
    queryFn: async () => {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = (adminRoles || []).map((r) => r.user_id);
      if (adminIds.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, company_name, contact_person, contact_phone, first_name, last_name")
        .in("user_id", adminIds)
        .order("email");
      if (error) throw error;
      return (data || []) as AdminProfile[];
    },
  });

  const filtered = admins.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.company_name || "").toLowerCase().includes(q) ||
      (a.contact_person || "").toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  const startEdit = (admin: AdminProfile) => {
    setEditingId(admin.user_id);
    setEditForm({
      company_name: admin.company_name,
      contact_person: admin.contact_person,
      contact_phone: admin.contact_phone,
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
      toast({ title: "Gespeichert", description: "Admin-Profil wurde aktualisiert." });
      cancelEdit();
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Fehler", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.contactPerson) {
      toast({ variant: "destructive", title: "Fehler", description: "Bitte alle Pflichtfelder ausfüllen." });
      return;
    }
    if (form.password.length < 6) {
      toast({ variant: "destructive", title: "Fehler", description: "Passwort muss mindestens 6 Zeichen haben." });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-customer", {
        body: { ...form, role: "admin" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Admin erstellt", description: "Der neue Admin wurde erfolgreich angelegt." });
      setForm({ email: "", password: "", companyName: "", contactPerson: "", contactPhone: "" });
      setShowCreate(false);
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Fehler", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administratoren
              </CardTitle>
              <CardDescription>{admins.length} Admin(s)</CardDescription>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <ShieldPlus className="h-4 w-4" />
              Admin anlegen
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Admin suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Laden...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">Keine Admins gefunden</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">E-Mail</TableHead>
                    <TableHead className="font-semibold">E-Mail</TableHead>
                    <TableHead className="font-semibold">Telefon</TableHead>
                    <TableHead className="font-semibold w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((admin) => (
                    <TableRow key={admin.user_id}>
                      <TableCell>
                        {editingId === admin.user_id ? (
                          <Input
                            value={editForm.contact_person || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, contact_person: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{admin.contact_person || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === admin.user_id ? (
                          <Input
                            value={editForm.company_name || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, company_name: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          admin.company_name || "-"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                      <TableCell>
                        {editingId === admin.user_id ? (
                          <Input
                            value={editForm.contact_phone || ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, contact_phone: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          admin.contact_phone || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === admin.user_id ? (
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700" onClick={() => saveEdit(admin.user_id)} disabled={isSaving}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive/80" onClick={cancelEdit} disabled={isSaving}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(admin)}>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldPlus className="h-5 w-5" />
              Admin anlegen
            </DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Administrator mit Zugangsdaten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Firma</Label>
              <Input value={form.companyName} onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Ansprechpartner *</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Max Mustermann" />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={form.contactPhone} onChange={(e) => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+49 123 456789" />
            </div>
            <div className="space-y-2">
              <Label>E-Mail *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@firma.de" />
            </div>
            <div className="space-y-2">
              <Label>Passwort *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mindestens 6 Zeichen" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={isSubmitting}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Erstellen...</> : "Admin anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
