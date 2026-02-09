import { useLanguage } from "@/contexts/LanguageContext";

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t.footer.terms}</h1>
      
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <p className="text-lg font-semibold">Allgemeine Geschäftsbedingungen und Kundeninformationen</p>

        {/* Teil I */}
        <h2 className="text-xl font-bold mt-8">I. Allgemeine Geschäftsbedingungen</h2>

        <section>
          <h3 className="text-lg font-semibold mb-3">§ 1 Grundlegende Bestimmungen</h3>
          <p className="text-muted-foreground mb-2">
            (1) Die nachstehenden Geschäftsbedingungen gelten für Verträge, die Sie mit uns als Anbieter (Thie GmbH) über die Internetseite www.thie-electronics.de schließen. Soweit nicht anders vereinbart, wird der Einbeziehung gegebenenfalls von Ihnen verwendeter eigener Bedingungen widersprochen.
          </p>
          <p className="text-muted-foreground">
            (2) Verbraucher im Sinne der nachstehenden Regelungen ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden kann. Unternehmer ist jede natürliche oder juristische Person oder eine rechtsfähige Personengesellschaft, die bei Abschluss eines Rechtsgeschäfts in Ausübung ihrer selbständigen beruflichen oder gewerblichen Tätigkeit handelt.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">§ 2 Zustandekommen des Vertrages</h3>
          <p className="text-muted-foreground mb-2">(1) Gegenstand des Vertrages ist der Verkauf von Waren.</p>
          <p className="text-muted-foreground mb-2">
            (2) Mit dem Versand des jeweiligen Produkts auf unserer Internetseite unterbreiten wir Ihnen ein verbindliches Angebot zum Abschluss eines Vertrages zu den in der Artikelbeschreibung angegebenen Bedingungen.
          </p>
          <div className="text-muted-foreground mb-2">
            <p className="mb-1">(3) Der Vertrag kommt über das Online-Warenkorbsystem wie folgt zustande:</p>
            <p className="mb-1">Die zum Kauf beabsichtigten Waren werden im „Warenkorb" abgelegt. Über die entsprechende Schaltfläche in der Navigationsleiste können Sie den „Warenkorb" aufrufen und dort jederzeit Änderungen vornehmen.</p>
            <p className="mb-1">Nach Aufrufen der Seite „Kasse" und der Eingabe der persönlichen Daten sowie der Zahlungs- und Versandbedingungen werden abschließend nochmals alle Bestelldaten auf der Bestellübersichtsseite angezeigt.</p>
            <p className="mb-1">Soweit Sie als Zahlungsart ein Sofortzahl-System (z.B. PayPal / PayPal Express, Amazon-Payments, Sofort / Stripe) nutzen, werden Sie entweder in unserem Online-Shop auf die Bestellübersichtsseite geführt oder Sie werden zunächst auf die Internetseite des Anbieters des Sofortzahl-Systems weitergeleitet.</p>
            <p className="mb-1">Erfolgt die Weiterleitung zu dem jeweiligen Sofortzahl-System, nehmen Sie dort die entsprechende Auswahl bzw. Eingabe Ihrer Daten vor. Abschließend werden Sie zurück in unseren Online-Shop auf die Bestellübersichtsseite geleitet.</p>
            <p className="mb-1">Vor Absenden der Bestellung haben Sie die Möglichkeit, hier sämtliche Angaben nochmals zu überprüfen, zu ändern (auch über die Funktion „zurück" des Internetbrowsers) bzw. den Kauf abzubrechen.</p>
            <p>Mit dem Absenden der Bestellung über die Schaltfläche „kaufen" erklären Sie rechtsverbindlich die Annahme des Angebotes, wodurch der Vertrag zustande kommt.</p>
          </div>
          <p className="text-muted-foreground mb-2">
            (4) Ihre Anfragen zur Erstellung eines Angebotes sind für Sie unverbindlich. Wir unterbreiten Ihnen hierzu ein verbindliches Angebot in Textform (z.B. per E-Mail), welches Sie innerhalb von 5 Tagen annehmen können.
          </p>
          <p className="text-muted-foreground">
            (5) Die Abwicklung der Bestellung und Übermittlung aller im Zusammenhang mit dem Vertragsschluss erforderlichen Informationen erfolgt per E-Mail zum Teil automatisiert. Sie haben deshalb sicherzustellen, dass die von Ihnen bei uns hinterlegte E-Mail-Adresse zutreffend ist, der Empfang der E-Mails technisch sichergestellt und insbesondere nicht durch SPAM-Filter verhindert wird.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">§ 3 Zurückbehaltungsrecht, Eigentumsvorbehalt</h3>
          <p className="text-muted-foreground mb-2">(1) Ein Zurückbehaltungsrecht können Sie nur ausüben, soweit es sich um Forderungen aus demselben Vertragsverhältnis handelt.</p>
          <p className="text-muted-foreground mb-2">(2) Die Ware bleibt bis zur vollständigen Zahlung des Kaufpreises unser Eigentum.</p>
          <div className="text-muted-foreground">
            <p className="mb-1">(3) Sind Sie Unternehmer, gilt ergänzend Folgendes:</p>
            <p className="mb-1">a) Wir behalten uns das Eigentum an der Ware bis zum vollständigen Ausgleich aller Forderungen aus der laufenden Geschäftsbeziehung vor. Vor Übergang des Eigentums an der Vorbehaltsware ist eine Verpfändung oder Sicherheitsübereignung nicht zulässig.</p>
            <p className="mb-1">b) Sie können die Ware im ordentlichen Geschäftsgang weiterverkaufen. Für diesen Fall treten Sie bereits jetzt alle Forderungen in Höhe des Rechnungsbetrages, die Ihnen aus dem Weiterverkauf erwachsen, an uns ab, wir nehmen die Abtretung an. Sie sind weiter zur Einziehung der Forderung ermächtigt. Soweit Sie Ihren Zahlungsverpflichtungen nicht ordnungsgemäß nachkommen, behalten wir uns allerdings vor, die Forderung selbst einzuziehen.</p>
            <p className="mb-1">c) Bei Verbindung und Vermischung der Vorbehaltsware erwerben wir Miteigentum an der neuen Sache im Verhältnis des Rechnungswertes der Vorbehaltsware zu den anderen verarbeiteten Gegenständen zum Zeitpunkt der Verarbeitung.</p>
            <p>d) Wir verpflichten uns, die uns zustehenden Sicherheiten auf Ihr Verlangen insoweit freizugeben, als der realisierbare Wert unserer Sicherheiten die zu sichernde Forderung um mehr als 10% übersteigt. Die Auswahl der freizugebenden Sicherheiten obliegt uns.</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">§ 4 Gewährleistung</h3>
          <p className="text-muted-foreground mb-2">(1) Es bestehen die gesetzlichen Mängelhaftungsrechte.</p>
          <div className="text-muted-foreground mb-2">
            <p className="mb-1">(2) Bei gebrauchten Sachen sind die Mängelansprüche ausgeschlossen, wenn sich der Mangel erst nach Ablauf eines Jahres ab Ablieferung der Sache zeigt. Zeigt sich der Mangel innerhalb eines Jahres ab Ablieferung der Sache, können die Mängelansprüche im Rahmen der gesetzlichen Verjährungsfrist von zwei Jahren ab Ablieferung der Sache geltend gemacht werden. Die vorstehende Einschränkung gilt nicht:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>für uns zurechenbare schuldhaft verursachte Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit und bei vorsätzlich oder grob fahrlässig verursachten sonstigen Schäden;</li>
              <li>soweit wir den Mangel arglistig verschwiegen oder eine Garantie für die Beschaffenheit der Sache übernommen haben.</li>
            </ul>
          </div>
          <p className="text-muted-foreground mb-2">(3) Als Verbraucher werden Sie gebeten, die Sache bei Lieferung umgehend auf Vollständigkeit, offensichtliche Mängel und Transportschäden zu überprüfen und uns sowie dem Spediteur Beanstandungen schnellstmöglich mitzuteilen. Kommen Sie dem nicht nach, hat dies keine Auswirkung auf Ihre gesetzlichen Gewährleistungsansprüche.</p>
          <div className="text-muted-foreground">
            <p className="mb-1">(4) Soweit Sie Unternehmer sind, gilt abweichend von den vorstehenden Gewährleistungsregelungen:</p>
            <p className="mb-1">a) Als Beschaffenheit der Sache gelten nur unsere eigenen Angaben und die Produktbeschreibung des Herstellers als vereinbart, nicht jedoch sonstige Werbung, öffentliche Anpreisungen und Äußerungen des Herstellers.</p>
            <p className="mb-1">b) Bei Mängeln leisten wir nach unserer Wahl Gewähr durch Nachbesserung oder Nachlieferung. Schlägt die Mangelbeseitigung fehl, können Sie nach Ihrer Wahl Minderung verlangen oder vom Vertrag zurücktreten. Die Mängelbeseitigung gilt nach erfolglosem zweiten Versuch als fehlgeschlagen, wenn sich nicht insbesondere aus der Art der Sache oder des Mangels oder den sonstigen Umständen etwas anderes ergibt. Im Falle der Nachbesserung müssen wir nicht die erhöhten Kosten tragen, die durch die Verbringung der Ware an einen anderen Ort als den Erfüllungsort entstehen, sofern die Verbringung nicht dem bestimmungsgemäßen Gebrauch der Ware entspricht.</p>
            <div>
              <p className="mb-1">c) Die Gewährleistungsfrist beträgt ein Jahr ab Ablieferung der Ware. Die Fristverkürzung gilt nicht:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>für uns zurechenbare schuldhaft verursachte Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit und bei vorsätzlich oder grob fahrlässig verursachten sonstigen Schäden;</li>
                <li>soweit wir den Mangel arglistig verschwiegen oder eine Garantie für die Beschaffenheit der Sache übernommen haben;</li>
                <li>bei Sachen, die entsprechend ihrer üblichen Verwendungsweise für ein Bauwerk verwendet worden sind und dessen Mangelhaftigkeit verursacht haben;</li>
                <li>bei gesetzlichen Rückgriffsansprüchen, die Sie im Zusammenhang mit Mängelrechten gegen uns haben.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">§ 5 Rechtswahl</h3>
          <p className="text-muted-foreground mb-2">(1) Es gilt deutsches Recht. Bei Verbrauchern gilt diese Rechtswahl nur, soweit hierdurch der durch zwingende Bestimmungen des Rechts des Staates des gewöhnlichen Aufenthaltes des Verbrauchers gewährte Schutz nicht entzogen wird (Günstigkeitsprinzip).</p>
          <p className="text-muted-foreground">(2) Die Bestimmungen des UN-Kaufrechts finden ausdrücklich keine Anwendung.</p>
        </section>

        {/* Teil II */}
        <h2 className="text-xl font-bold mt-8">II. Kundeninformationen</h2>

        <section>
          <h3 className="text-lg font-semibold mb-3">1. Identität des Verkäufers</h3>
          <div className="text-muted-foreground">
            <p>Thie GmbH</p>
            <p>Navarrastraße 15</p>
            <p>33106 Paderborn</p>
            <p>Deutschland</p>
            <p className="mt-2">E-Mail: info@thie-eco.de</p>
            <p className="mt-2">
              Alternative Streitbeilegung: Die Europäische Kommission stellt eine Plattform für die außergerichtliche Online-Streitbeilegung (OS-Plattform) bereit, aufrufbar unter{" "}
              <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                https://ec.europa.eu/odr
              </a>.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">2. Informationen zum Zustandekommen des Vertrages</h3>
          <p className="text-muted-foreground">
            Die technischen Schritte zum Vertragsschluss, der Vertragsschluss selbst und die Korrekturmöglichkeiten erfolgen nach Maßgabe der Regelungen „Zustandekommen des Vertrages" unserer Allgemeinen Geschäftsbedingungen (Teil I.).
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">3. Vertragssprache, Vertragstextspeicherung</h3>
          <p className="text-muted-foreground mb-2">3.1. Vertragssprache ist deutsch.</p>
          <p className="text-muted-foreground mb-2">
            3.2. Der vollständige Vertragstext wird von uns nicht gespeichert. Vor Absenden der Bestellung über das Online-Warenkorbsystem können die Vertragsdaten über die Druckfunktion des Browsers ausgedruckt oder elektronisch gesichert werden. Nach Zugang der Bestellung bei uns werden die Bestelldaten, die gesetzlich vorgeschriebenen Informationen bei Fernabsatzverträgen und die Allgemeinen Geschäftsbedingungen nochmals per E-Mail an Sie übersandt.
          </p>
          <p className="text-muted-foreground">
            3.3. Bei Angebotsanfragen außerhalb des Online-Warenkorbsystems erhalten Sie alle Vertragsdaten im Rahmen eines verbindlichen Angebotes in Textform übersandt, z.B. per E-Mail, welche Sie ausdrucken oder elektronisch sichern können.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">4. Wesentliche Merkmale der Ware oder Dienstleistung</h3>
          <p className="text-muted-foreground">
            Die wesentlichen Merkmale der Ware und/oder Dienstleistung finden sich im jeweiligen Angebot.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">5. Preise und Zahlungsmodalitäten</h3>
          <p className="text-muted-foreground mb-2">5.1. Die in den jeweiligen Angeboten angeführten Preise sowie die Versandkosten stellen Gesamtpreise dar. Sie beinhalten alle Preisbestandteile einschließlich aller anfallenden Steuern.</p>
          <p className="text-muted-foreground mb-2">5.2. Die anfallenden Versandkosten sind nicht im Kaufpreis enthalten. Sie sind über eine entsprechend bezeichnete Schaltfläche auf unserer Internetpräsenz oder im jeweiligen Angebot aufrufbar, werden im Laufe des Bestellvorganges gesondert ausgewiesen und sind von Ihnen zusätzlich zu tragen, soweit nicht die versandkostenfreie Lieferung zugesagt ist.</p>
          <p className="text-muted-foreground mb-2">5.3. Entstandene Kosten der Geldübermittlung (Überweisungs- oder Wechselkursgebühren der Kreditinstitute) sind von Ihnen in den Fällen zu tragen, in denen die Lieferung in einen EU-Mitgliedsstaat erfolgt, die Zahlung aber außerhalb der Europäischen Union veranlasst wurde.</p>
          <p className="text-muted-foreground mb-2">5.4. Die Ihnen zur Verfügung stehenden Zahlungsarten sind unter einer entsprechend bezeichneten Schaltfläche auf unserer Internetpräsenz oder im jeweiligen Angebot ausgewiesen.</p>
          <p className="text-muted-foreground">5.5. Soweit bei den einzelnen Zahlungsarten nicht anders angegeben, sind die Zahlungsansprüche aus dem geschlossenen Vertrag sofort zur Zahlung fällig.</p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">6. Lieferbedingungen</h3>
          <p className="text-muted-foreground mb-2">6.1. Die Lieferbedingungen, der Liefertermin sowie gegebenenfalls bestehende Lieferbeschränkungen finden sich unter einer entsprechend bezeichneten Schaltfläche auf unserer Internetpräsenz oder im jeweiligen Angebot.</p>
          <p className="text-muted-foreground mb-2">6.2. Soweit Sie Verbraucher sind ist gesetzlich geregelt, dass die Gefahr des zufälligen Untergangs und der zufälligen Verschlechterung der verkauften Sache während der Versendung erst mit der Übergabe der Ware an Sie übergeht, unabhängig davon, ob die Versendung versichert oder unversichert erfolgt. Dies gilt nicht, wenn Sie eigenständig ein nicht vom Unternehmer benanntes Transportunternehmen oder eine sonst zur Ausführung der Versendung bestimmte Person beauftragt haben.</p>
          <p className="text-muted-foreground">Sind Sie Unternehmer, erfolgt die Lieferung und Versendung auf Ihre Gefahr.</p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">7. Gesetzliches Mängelhaftungsrecht</h3>
          <p className="text-muted-foreground">
            Die Mängelhaftung richtet sich nach der Regelung „Gewährleistung" in unseren Allgemeinen Geschäftsbedingungen (Teil I).
          </p>
        </section>

        <section className="border-t pt-4 mt-8">
          <p className="text-xs text-muted-foreground">
            Diese AGB und Kundeninformationen wurden von den auf IT-Recht spezialisierten Juristen des Händlerbundes erstellt und werden permanent auf Rechtskonformität geprüft. Die Händlerbund Management AG garantiert für die Rechtssicherheit der Texte und haftet im Falle von Abmahnungen. Nähere Informationen dazu finden Sie unter:{" "}
            <a href="https://www.haendlerbund.de/agb-service" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              https://www.haendlerbund.de/agb-service
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
