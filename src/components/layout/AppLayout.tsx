import { Outlet, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ReservationTimer } from "./ReservationTimer";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const showBanner = user && !user.isAdmin && !user.profileCompleted;
  const pi = (t as any).profileIncomplete || {};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReservationTimer />
      <Header />
      {showBanner && (
        <div className="bg-warning/10 border-b border-warning/30">
          <div className="container flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm text-foreground flex-1">
              {pi.description || "To place orders, you must first complete your profile."}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-warning/50 hover:bg-warning/10"
              onClick={() => navigate("/complete-profile")}
            >
              {pi.completeProfile || "Complete Profile"}
            </Button>
          </div>
        </div>
      )}
      <main className="container py-6 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
