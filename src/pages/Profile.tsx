import { useState, useRef } from "react";
import { Building2, User, Mail, Phone, Camera, Loader2, X, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    companyName: user?.companyName || "",
    contactPerson: user?.contactPerson || "",
    contactPhone: user?.contactPhone || "",
    logoUrl: user?.logoUrl || null as string | null,
  });

  // Reset form when user changes or editing starts
  const startEditing = () => {
    setFormData({
      companyName: user?.companyName || "",
      contactPerson: user?.contactPerson || "",
      contactPhone: user?.contactPhone || "",
      logoUrl: user?.logoUrl || null,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setFormData({
      companyName: user?.companyName || "",
      contactPerson: user?.contactPerson || "",
      contactPhone: user?.contactPhone || "",
      logoUrl: user?.logoUrl || null,
    });
    setIsEditing(false);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wählen Sie eine Bilddatei aus");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Die Datei darf maximal 2MB groß sein");
      return;
    }

    setIsUploadingLogo(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?v=${Date.now()}`;
      setFormData(prev => ({ ...prev, logoUrl: urlWithCacheBuster }));
      
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Fehler beim Hochladen des Logos");
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!user) return;

    try {
      // List files in user's folder
      const { data: files } = await supabase.storage
        .from("company-logos")
        .list(user.id);

      if (files && files.length > 0) {
        const filesToDelete = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage
          .from("company-logos")
          .remove(filesToDelete);
      }

      setFormData(prev => ({ ...prev, logoUrl: null }));
    } catch (error) {
      console.error("Error removing logo:", error);
      toast.error("Fehler beim Entfernen des Logos");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: formData.companyName.trim() || null,
          contact_person: formData.contactPerson.trim() || null,
          contact_phone: formData.contactPhone.trim() || null,
          logo_url: formData.logoUrl,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(t.profile.saveSuccess, {
        description: t.profile.saveSuccessDesc,
      });
      
      setIsEditing(false);
      
      // Refresh the page to update user context
      window.location.reload();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(t.profile.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  // Don't show edit functionality for admins
  const canEdit = !isAdmin;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.profile.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {t.profile.description}
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
            {/* Logo/Avatar */}
            <div className="relative">
              <Avatar className="h-20 w-20 sm:h-16 sm:w-16">
                {formData.logoUrl ? (
                  <AvatarImage src={formData.logoUrl} alt="Company logo" />
                ) : null}
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground sm:text-xl">
                  {user?.initials}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <CardTitle className="text-lg sm:text-base">{isEditing ? formData.contactPerson || user?.email : user?.contactPerson || user?.email}</CardTitle>
              <CardDescription>{isEditing ? formData.companyName : user?.companyName}</CardDescription>
            </div>
            
            {canEdit && !isEditing && (
              <Button variant="outline" size="sm" onClick={startEditing} className="mt-2 sm:mt-0">
                <Pencil className="mr-2 h-4 w-4" />
                {t.profile.editProfile}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Logo Management (only in edit mode) */}
          {isEditing && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                {t.profile.companyLogo}
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Hochladen...
                    </>
                  ) : formData.logoUrl ? (
                    t.profile.changeLogo
                  ) : (
                    t.profile.uploadLogo
                  )}
                </Button>
                {formData.logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t.profile.removeLogo}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t.profile.logoHint}</p>
            </div>
          )}
          
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {t.profile.companyName}
            </Label>
            <Input
              id="companyName"
              value={isEditing ? formData.companyName : (user?.companyName || "")}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
              placeholder="Ihre Firma GmbH"
            />
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="contactPerson" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {t.profile.contactPerson}
            </Label>
            <Input
              id="contactPerson"
              value={isEditing ? formData.contactPerson : (user?.contactPerson || "")}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
              placeholder="Max Mustermann"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {t.profile.contactPhone}
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              value={isEditing ? formData.contactPhone : (user?.contactPhone || "")}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
              placeholder="+49 123 456789"
            />
          </div>

          {/* Email (always read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {t.profile.email}
            </Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Action Buttons */}
          {isEditing ? (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                {t.profile.cancelEdit}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.profile.saving}
                  </>
                ) : (
                  t.profile.saveChanges
                )}
              </Button>
            </div>
          ) : canEdit ? (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={startEditing}>
                <Pencil className="mr-2 h-4 w-4" />
                {t.profile.editProfile}
              </Button>
            </div>
          ) : (
            <p className="pt-4 text-center text-sm text-muted-foreground">
              Profilbearbeitung ist für Administratoren deaktiviert
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
