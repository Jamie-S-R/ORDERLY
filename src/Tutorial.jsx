import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const tutorialSteps = [
  {
    title: 'Was ist ORDERLY?',
    content: (
      <>
        <p>
          <strong>ORDERLY</strong> ist eine smarte, cloudbasierte SaaS-Lösung für kleine und mittlere Unternehmen (KMU), die den gesamten <strong>Materialeinkauf automatisieren</strong> und vereinfachen soll.
        </p>
        <p>
          Durch intelligente Auswertung vergangener Lagerbewegungen schlägt ORDERLY automatisch Bestellungen vor, erkennt Engpässe, bewertet Lieferanten und zeigt dir Retourengründe sowie finanzielle Entwicklungen.
        </p>
        <p>
          Du brauchst keine Installation, keine Schulung – ORDERLY ist <strong>sofort einsatzbereit</strong> und läuft auf jedem Gerät im Browser.
        </p>
        <ul>
          <li>📦 Automatisierte Nachbestellungen</li>
          <li>📈 Analyse von Lager, Retouren & Lieferanten</li>
          <li>💶 Transparenz über Kosten und Verbrauch</li>
          <li>🧠 Unterstützung durch KI</li>
        </ul>
        <p>Im Folgenden lernst du alle Funktionen Schritt für Schritt kennen.</p>
      </>
    )
  },
  {
    title: 'Willkommen bei ORDERLY',
    content: (
      <>
        <p>
          Willkommen bei <strong>ORDERLY</strong> – deinem digitalen Werkzeug für smartes Lager- und Bestellmanagement.
        </p>
        <p>
          Dieses Tutorial führt dich durch alle Funktionen Schritt für Schritt. Du kannst direkt mitklicken.
        </p>
        <p>
          Klicke auf <strong>Weiter</strong>, um zu starten.
        </p>
      </>
    )
  },
  {
    title: 'Bestelllog & Ausgänge',
    content: (
      <>
        <p>
          Im <Link className="section-link" to="/orderlog">Bestelllog</Link> findest du alle bisherigen Bestellungen. Jede Bestellung ist anklickbar – mit Details zu Datum, Menge, Preis und Artikel.
        </p>
        <p>
          Unter <Link className="section-link" to="/outputlog">Ausgänge</Link> sind alle Verbrauchsvorgänge gelistet – inklusive Artikelnummer, Menge, Datum und Abteilung.
        </p>
      </>
    )
  },
  {
    title: 'Lagerverlauf & Termintreue',
    content: (
      <>
        <p>
          Der <Link className="section-link" to="/lagerverlauf">Lagerverlauf</Link> visualisiert deinen Lagerbestand monatlich:
        </p>
        <ul>
          <li>Bestellungen pro Monat</li>
          <li>Verbrauch / Ausgänge</li>
          <li>Entwicklung des Lagerbestands</li>
        </ul>
        <p>
          Unter <Link className="section-link" to="/termintreue">Termintreue</Link> analysierst du die Pünktlichkeit deiner Lieferanten:
        </p>
        <ul>
          <li>Anteil pünktlicher Lieferungen</li>
          <li>Durchschnittliche Verspätung</li>
        </ul>
      </>
    )
  },
  {
    title: 'Retouren & Engpässe',
    content: (
      <>
        <p>
          Die <Link className="section-link" to="/retouren">Retouren</Link>-Ansicht zeigt dir:
        </p>
        <ul>
          <li>Welche Artikel oft zurückgehen</li>
          <li>Von welchem Lieferanten sie stammen</li>
          <li>Einzelne Rückläufer mit Grund</li>
        </ul>
        <p>
          In <Link className="section-link" to="/engpaesse">Engpässe</Link> werden automatisch kritische Artikel erkannt. Du siehst:
        </p>
        <ul>
          <li>Welche Produkte aktuell kritisch sind</li>
          <li>Wie lange sie schon kritisch sind</li>
        </ul>
      </>
    )
  },
  {
    title: 'Finanzen & Bewertung',
    content: (
      <>
        <p>
          Unter <Link className="section-link" to="/finanzen">Finanzen</Link> siehst du:
        </p>
        <ul>
          <li>Monatliche Gesamtausgaben</li>
          <li>Kosten nach Warengruppe (z. B. Bremsen, Antrieb, Sonstiges)</li>
          <li>Trends deiner Einkaufsentwicklung</li>
        </ul>
        <p>
          Die <Link className="section-link" to="/lieferantenbewertung">Lieferantenbewertung</Link> bewertet deine Lieferanten nach:
        </p>
        <ul>
          <li>Pünktlichkeit</li>
          <li>Retourenquote</li>
          <li>Preisniveau</li>
        </ul>
      </>
    )
  },
  {
    title: 'Automatisierung & Feedback',
    content: (
      <>
        <p>
          Im Bereich <Link className="section-link" to="/automatisierung">Automatisierung</Link> siehst du, welche Bestellungen bereits automatisch vorgeschlagen wurden – basierend auf Artikelverbrauch und Mindestmengen.
        </p>
        <ul>
          <li>Automatische Bestellvorschläge nach KI-Analyse</li>
          <li>Übersicht aller geplanten Nachbestellungen</li>
          <li>Letzte manuelle Bestellungen zur Nachverfolgung</li>
        </ul>
        <p>
          Über <Link className="section-link" to="/feedback">Feedback</Link> kannst du jederzeit Rückmeldung geben oder Ideen einreichen.
        </p>
      </>
    )
  },
  {
    title: 'Setup, Datenschutz & Support',
    content: (
      <>
        <p><strong>Einrichtung:</strong> Keine Installation nötig. Einfach im Browser öffnen. Benutzer per Mail einladen und Rechte verteilen.</p>
        <p><strong>Datenschutz:</strong> DSGVO-konform. Alle Daten liegen verschlüsselt auf Servern in der EU. Keine Weitergabe.</p>
        <p><strong>Support:</strong> In der Pilotphase stehen wir persönlich zur Verfügung. Danach via Ticketsystem oder Videochat.</p>
      </>
    )
  },
  {
    title: 'Tutorial abgeschlossen',
    content: (
      <>
        <p>Das war das Tutorial zu ORDERLY!</p>
        <p>Du kannst dieses Tutorial jederzeit erneut über <code>/tutorial</code> aufrufen.</p>
        <p>Viel Spaß beim Arbeiten mit ORDERLY! 🚀</p>
      </>
    )
  }
];

const Tutorial = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const isFirst = step === 0;
  const isLast = step === tutorialSteps.length - 1;

  const handleNext = () => isLast ? navigate('/') : setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="detail-view">
      <h2>{tutorialSteps[step].title}</h2>
      <div>{tutorialSteps[step].content}</div>
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleBack} disabled={isFirst} style={{ opacity: isFirst ? 0.5 : 1 }}>
          Zurück
        </button>
        <button onClick={handleNext}>
          {isLast ? 'Zur Startseite' : 'Weiter'}
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
