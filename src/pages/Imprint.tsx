import { useLanguage } from "@/contexts/LanguageContext";

export default function Imprint() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t.footer.imprint}</h1>
      
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">Angaben gemäß § 5 TMG</h2>
          <div className="text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Muster GmbH</p>
            <p>Musterstraße 123</p>
            <p>12345 Musterstadt</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Kontakt</h2>
          <div className="text-muted-foreground space-y-1">
            <p>Telefon: +49 (0) 123 456789</p>
            <p>E-Mail: info@example.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Vertretungsberechtigter</h2>
          <p className="text-muted-foreground">
            Geschäftsführer: Max Mustermann
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Registereintrag</h2>
          <div className="text-muted-foreground space-y-1">
            <p>Registergericht: Amtsgericht Musterstadt</p>
            <p>Registernummer: HRB 12345</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Umsatzsteuer-ID</h2>
          <p className="text-muted-foreground">
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: DE123456789
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <div className="text-muted-foreground space-y-1">
            <p>Max Mustermann</p>
            <p>Musterstraße 123</p>
            <p>12345 Musterstadt</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Streitschlichtung</h2>
          <p className="text-muted-foreground">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p className="text-muted-foreground mt-2">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </div>
  );
}
