import { useLanguage } from "@/contexts/LanguageContext";

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t.footer.terms}</h1>
      
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Geltungsbereich</h2>
          <p className="text-muted-foreground">
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen, die über dieses B2B-Portal getätigt werden. Mit der Nutzung des Portals akzeptieren Sie diese Bedingungen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Vertragsschluss</h2>
          <p className="text-muted-foreground">
            Die Darstellung der Produkte im Portal stellt kein rechtlich bindendes Angebot dar. Durch das Absenden einer Anfrage geben Sie ein verbindliches Angebot ab. Der Vertrag kommt erst durch unsere Bestätigung zustande.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Preise und Zahlung</h2>
          <p className="text-muted-foreground">
            Alle angegebenen Preise verstehen sich in Euro und zzgl. der gesetzlichen Mehrwertsteuer. Die Zahlung erfolgt nach Rechnungsstellung innerhalb von 14 Tagen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. Versand</h2>
          <ul className="text-muted-foreground list-disc list-inside space-y-2">
            <li>Kostenloser Versand ab 50 Geräten</li>
            <li>Unter 50 Geräten: 20,00 € Versandkosten</li>
            <li>Expressversand: 50,00 € + 1% des Gesamtwarenwertes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. Gewährleistung</h2>
          <p className="text-muted-foreground">
            Für alle refurbished Geräte gilt eine Gewährleistungsfrist von 12 Monaten ab Lieferung. Die Gewährleistung umfasst Mängel, die zum Zeitpunkt der Lieferung bereits vorhanden waren.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. Haftung</h2>
          <p className="text-muted-foreground">
            Unsere Haftung ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">7. Schlussbestimmungen</h2>
          <p className="text-muted-foreground">
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz unseres Unternehmens.
          </p>
        </section>
      </div>
    </div>
  );
}
