import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Register() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.password) {
      setError("Bitte füllen Sie alle Felder aus");
      return;
    }

    if (formData.password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Die Passwörter stimmen nicht überein");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      email: formData.email,
      password: formData.password,
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error || "Registrierung fehlgeschlagen");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">T</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Thie B2B Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registrieren Sie Ihr Unternehmen</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Registrierung</CardTitle>
            <CardDescription>
              Erstellen Sie ein Konto für Ihr Unternehmen
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="companyName">Firmenname</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Ihre Firma GmbH"
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Ansprechpartner</Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  placeholder="Max Mustermann"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ihre@email.de"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mindestens 6 Zeichen"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Passwort wiederholen"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrieren...
                  </>
                ) : (
                  "Registrieren"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Bereits registriert?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Anmelden
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
