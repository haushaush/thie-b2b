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
            <p className="font-medium text-foreground">Thie GmbH</p>
            <p>Navarrastraße 15</p>
            <p>33106 Paderborn</p>
          </div>
          <p className="text-muted-foreground mt-3">
            Vertreten durch: Alexander Marzeion (Geschäftsführer)
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Kontakt</h2>
          <div className="text-muted-foreground space-y-1">
            <p>Telefon: 05251 5438 006</p>
            <p>E-Mail: kontakt@thie-eco.de</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Registereintrag</h2>
          <div className="text-muted-foreground space-y-1">
            <p>Amtsgericht Paderborn: HRB 14169</p>
            <p>USt.-ID: DE326347764</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Haftung für Inhalte</h2>
          <p className="text-muted-foreground">
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
          <p className="text-muted-foreground mt-3">
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Haftung für Links</h2>
          <p className="text-muted-foreground">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
          </p>
          <p className="text-muted-foreground mt-3">
            Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Urheberrecht</h2>
          <p className="text-muted-foreground">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          </p>
          <p className="text-muted-foreground mt-3">
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
          </p>
        </section>
      </div>
    </div>
  );
}
