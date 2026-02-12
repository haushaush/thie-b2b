import { Timer } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function ReservationTimer() {
  const { isReservationActive, reservationSecondsLeft } = useCart();
  const { t } = useLanguage();

  if (!isReservationActive) return null;

  const minutes = Math.floor(reservationSecondsLeft / 60);
  const seconds = reservationSecondsLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isLow = reservationSecondsLeft <= 15;

  return (
    <div
      className={`w-full py-1.5 text-center text-sm font-medium transition-colors ${
        isLow
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "bg-primary text-primary-foreground"
      }`}
    >
      <div className="container flex items-center justify-center gap-2">
        <Timer className="h-4 w-4" />
        <span>
          {(t.cart as any).reservationTimer
            ? (t.cart as any).reservationTimer.replace("{time}", timeString)
            : `Products reserved for ${timeString}`}
        </span>
      </div>
    </div>
  );
}
