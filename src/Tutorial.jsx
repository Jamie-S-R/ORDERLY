import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const tutorialSteps = [
  {
    title: 'Willkommen bei ORDERLY',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          <strong>ORDERLY</strong> ist deine cloudbasierte Lösung für smartes Lager- und Bestellmanagement. Ohne Installation, sofort einsatzbereit im Browser, hilft ORDERLY kleinen und mittleren Unternehmen, ihre Prozesse effizienter zu gestalten.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Automatische Nachbestellungen basierend auf Lagerbeständen</li>
          <li>Transparente Analysen zu Kosten, Retouren und Lieferanten</li>
          <li>Einfaches Scannen von Barcodes für Eingänge und Ausgänge</li>
          <li>Intuitive Dashboards für volle Kontrolle</li>
        </ul>
        <p className="mt-2">
          Dieses Tutorial führt dich durch alle Funktionen. Klicke auf <strong>Weiter</strong>, um zu starten!
        </p>
      </>
    ),
  },
  {
    title: 'Barcode-Scanner: Schnelle Datenerfassung',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Mit dem <Link className="section-link text-[#f7a440] hover:underline" to="/live-scannen">Barcode-Scanner</Link> erfassen du Eingänge, Ausgänge und Retouren schnell per Kamera oder manueller Eingabe. Alle Daten werden direkt in die Supabase-Datenbank gespeichert.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Scanne Barcodes für Bestellungen, Verbrauch oder Retouren</li>
          <li>Automatische Aktualisierung des Lagerbestands</li>
          <li>Manuelle Eingabe für maximale Flexibilität</li>
          <li>Echtzeit-Übersicht der letzten Einträge</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Automatisierung: Intelligente Nachbestellungen',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Der <Link className="section-link text-[#f7a440] hover:underline" to="/automatisierung">Automatisierungsbereich</Link> überwacht deine Lagerbestände und schlägt Nachbestellungen vor, sobald Artikel knapp werden. Bald kannst du Bestellungen direkt über Lieferanten-APIs auslösen.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Automatische Erkennung niedriger Lagerbestände</li>
          <li>Übersichtliche Bestellvorschläge mit Status</li>
          <li>Vorbereitung für nahtlose Lieferanten-API-Integration</li>
          <li>Zeitersparnis durch weniger manuelle Bestellungen</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Lagerverlauf: Bestandsentwicklung im Blick',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Der <Link className="section-link text-[#f7a440] hover:underline" to="/lagerverlauf">Lagerverlauf</Link> zeigt dir monatlich, wie sich dein Lagerbestand entwickelt, basierend auf Bestellungen und Verbrauch.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Visualisierung von Zu- und Abgängen</li>
          <li>Filter nach Lieferant oder Artikel</li>
          <li>Monatliche Bestandsentwicklung als Diagramm</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Retouren: Analyse von Rückläufern',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Die <Link className="section-link text-[#f7a440] hover:underline" to="/retouren">Retourenanalyse</Link> gibt dir Einblick in Rückläufer, ihre Gründe und betroffene Lieferanten.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Anzahl der Retouren pro Lieferant und Artikel</li>
          <li>Detailansicht mit Retourengründen</li>
          <li>Filterbare Statistiken für gezielte Analysen</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Termintreue: Lieferantenpünktlichkeit',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Unter <Link className="section-link text-[#f7a440] hover:underline" to="/termintreue">Termintreue</Link> siehst du, wie pünktlich deine Lieferanten liefern, und analysierst Verspätungen.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Pünktlichkeitsrate pro Lieferant und Monat</li>
          <li>Durchschnittliche Verspätung in Tagen</li>
          <li>Verteilung der Verspätungen als Diagramm</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Lieferantenbewertung: Vergleich und Optimierung',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Die <Link className="section-link text-[#f7a440] hover:underline" to="/lieferantenbewertung">Lieferantenbewertung</Link> vergleicht Lieferanten nach Pünktlichkeit, Retourenquote und Lieferdauer.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Radar-Diagramm für Lieferantenvergleich</li>
          <li>Detailansicht für einzelne Lieferanten</li>
          <li>Analyse von Engpässen und Retouren</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Engpässe: Kritische Lagerbestände erkennen',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Die <Link className="section-link text-[#f7a440] hover:underline" to="/engpaesse">Engpassanalyse</Link> identifiziert kritische Artikel und zeigt, wie lange sie bereits problematisch sind.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Übersicht kritischer Lagerbestände</li>
          <li>Filter nach Lieferant oder Zeitraum</li>
          <li>Detailansicht für betroffene Artikel</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Finanzen: Kosten im Griff',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Unter <Link className="section-link text-[#f7a440] hover:underline" to="/finanzen">Finanzen</Link> behältst du deine Ausgaben und Lieferzeiten im Blick, um Kosten zu optimieren.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Monatliche Ausgaben nach Lieferant oder Kategorie</li>
          <li>Gesamtausgaben und durchschnittlicher Bestellwert</li>
          <li>Trends zur finanziellen Planung</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Bestell- und Ausgangsprotokoll',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Im <Link className="section-link text-[#f7a440] hover:underline" to="/orderlog">Bestelllog</Link> und <Link className="section-link text-[#f7a440] hover:underline" to="/outputlog">Ausgangslog</Link> findest du detaillierte Protokolle aller Bestellungen und Verbrauchsvorgänge.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Bestellhistorie mit Details zu Menge, Preis und Lieferant</li>
          <li>Ausgangsprotokoll mit Verbrauch und Lagerbestandsänderungen</li>
          <li>Löschen oder Anzeigen von Details möglich</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Feedback und Support',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Gib uns dein <Link className="section-link text-[#f7a440] hover:underline" to="/feedback">Feedback</Link>, um ORDERLY weiter zu verbessern, oder kontaktiere unseren <Link className="section-link text-[#f7a440] hover:underline" to="/help">Support</Link>.
        </p>
        <ul className="list-disc list-inside text-gray-300 mt-2">
          <li>Feedback direkt über die Plattform einreichen</li>
          <li>Support in der Pilotphase per Videochat oder Ticketsystem</li>
          <li>DSGVO-konforme Datenverarbeitung in der EU</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Tutorial abgeschlossen',
    content: (
      <>
        <p className="text-gray-300 mb-4">
          Wir sind <strong>ORDERLY</strong>, wir wollen KMUs dabei helfen, Bestellungen zu automatisieren und Lagerführung zu betreiben.
        </p>
        <p>
          Du hast das Tutorial zu ORDERLY erfolgreich abgeschlossen! Starte jetzt mit der Optimierung deines Lagers und deiner Bestellungen.
        </p>
        <p>
          Rufe das Tutorial jederzeit unter <code>/tutorial</code> erneut auf oder gehe direkt zum <Link className="section-link text-[#f7a440] hover:underline" to="/">Dashboard</Link>.
        </p>
        <p className="mt-2">
          Viel Erfolg mit ORDERLY! 🚀
        </p>
      </>
    ),
  },
];

const Tutorial = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const isFirst = step === 0;
  const isLast = step === tutorialSteps.length - 1;

  const handleNext = () => isLast ? navigate('/') : setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">{tutorialSteps[step].title}</h2>
      <div className="text-gray-300 text-sm sm:text-base">{tutorialSteps[step].content}</div>
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          disabled={isFirst}
          className={`px-4 py-2 rounded-lg text-white ${isFirst ? 'bg-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#3b82f6] hover:bg-[#2563eb]'}`}
        >
          Zurück
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb]"
        >
          {isLast ? 'Zur Startseite' : 'Weiter'}
        </button>
      </div>
    </div>
  );
};

export default Tutorial;