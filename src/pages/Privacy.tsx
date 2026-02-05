import { useLanguage } from "@/contexts/LanguageContext";

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t.footer.privacy}</h1>
      
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Verantwortlicher</h2>
          <p className="text-muted-foreground">
            Verantwortlich für die Datenverarbeitung auf dieser Website ist der Betreiber des B2B-Portals. Kontaktdaten finden Sie im Impressum.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Erhobene Daten</h2>
          <p className="text-muted-foreground">
            Wir erheben und verarbeiten folgende personenbezogene Daten:
          </p>
          <ul className="text-muted-foreground list-disc list-inside space-y-2 mt-2">
            <li>Kontaktdaten (Name, E-Mail, Telefon)</li>
            <li>Unternehmensdaten (Firmenname)</li>
            <li>Bestellhistorie und Anfragen</li>
            <li>Technische Daten (IP-Adresse, Browser)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Zweck der Verarbeitung</h2>
          <p className="text-muted-foreground">
            Die Daten werden zur Vertragserfüllung, Kundenkommunikation und zur Verbesserung unserer Dienste verwendet.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. Rechtsgrundlage</h2>
          <p className="text-muted-foreground">
            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. Ihre Rechte</h2>
          <p className="text-muted-foreground">
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Kontaktieren Sie uns hierzu über die im Impressum angegebenen Kontaktdaten.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. Datensicherheit</h2>
          <p className="text-muted-foreground">
            Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen Manipulation, Verlust oder unberechtigten Zugriff zu schützen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">7. Cookies</h2>
          <p className="text-muted-foreground">
            Diese Website verwendet technisch notwendige Cookies für die Authentifizierung und Sitzungsverwaltung. Eine Einwilligung ist hierfür nicht erforderlich.
          </p>
        </section>
      </div>
    </div>
  );
}
