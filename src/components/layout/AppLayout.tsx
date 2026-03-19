import { Outlet, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ReservationTimer } from "./ReservationTimer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showBanner = user && !user.isAdmin && !user.profileCompleted;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReservationTimer />
      <Header />
      {showBanner && (
        <div className="bg-warning/10 border-b border-warning/30">
          <div className="container flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm text-foreground flex-1">
              Ihr Profil ist unvollständig. Bitte vervollständigen Sie Ihre Unternehmensdaten, um Bestellungen tätigen zu können.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-warning/50 hover:bg-warning/10"
              onClick={() => navigate("/complete-profile")}
            >
              Profil vervollständigen
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
