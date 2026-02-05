import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container py-6 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
