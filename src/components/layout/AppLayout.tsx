import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ReservationTimer } from "./ReservationTimer";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReservationTimer />
      <Header />
      <main className="container py-6 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
