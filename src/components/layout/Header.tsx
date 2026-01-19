import { useState } from "react";
import { Menu, X, LayoutDashboard, FileText, User, LogOut, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Requests", href: "/requests", icon: FileText },
  { name: "Profile", href: "/profile", icon: User },
];

const adminNavigationItems = [
  { name: "Admin", href: "/admin", icon: Settings },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  
  const allNavItems = isAdmin 
    ? [...navigationItems, ...adminNavigationItems] 
    : navigationItems;
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center">
          <img 
            src="/logo.svg" 
            alt="Thie Logo" 
            className="h-10 w-auto"
          />
        </Link>

        {/* Right side: User initials + Hamburger */}
        <div className="flex items-center gap-3">
          {/* User Initials Badge */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user?.initials || "??"}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-sidebar p-0">
              <SheetHeader className="border-b border-sidebar-border p-6">
                <SheetTitle className="text-left text-sidebar-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
                      {user?.initials || "??"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.contactPerson}</span>
                      <span className="text-xs text-sidebar-foreground/70">{user?.companyName}</span>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-4">
                {allNavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}

                <div className="my-2 border-t border-sidebar-border" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-destructive/20 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
