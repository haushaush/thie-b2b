import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Register() {
  const [formData, setFormData] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.companyName || !formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError(t.auth.register.error);
      return;
    }

    if (formData.password.length < 6) {
      setError(t.auth.register.error);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.register.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      email: formData.email,
      password: formData.password,
      companyName: formData.companyName,
      contactPerson: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.error || t.auth.register.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <img src="/thie-logo.png" alt="Thie Logo" className="mb-1 h-14 w-auto" />
          <h1 className="text-2xl font-bold text-primary">Thie B2B Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.auth.register.description}</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">{t.auth.register.title}</CardTitle>
            <CardDescription>
              {t.auth.register.description}
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
                <Label htmlFor="companyName">{t.auth.register.companyName}</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder={t.auth.register.companyNamePlaceholder}
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t.auth.register.firstName}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder={t.auth.register.firstNamePlaceholder}
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t.auth.register.lastName}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder={t.auth.register.lastNamePlaceholder}
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.register.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t.auth.register.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.register.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.auth.register.passwordPlaceholder}
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
                <Label htmlFor="confirmPassword">{t.auth.register.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.auth.register.confirmPasswordPlaceholder}
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
                    {t.auth.register.loading}
                  </>
                ) : (
                  t.auth.register.submit
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t.auth.register.hasAccount}{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  {t.auth.register.login}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
