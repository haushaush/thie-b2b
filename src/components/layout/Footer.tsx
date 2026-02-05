import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="container py-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t.footer.companyName}. {t.footer.allRightsReserved}
          </p>

          {/* Legal Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link 
              to="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.footer.terms}
            </Link>
            <Link 
              to="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.footer.privacy}
            </Link>
            <Link 
              to="/imprint" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.footer.imprint}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
