import React from 'react';
import { Link } from 'react-router-dom';

const Abschnitt = ({ icon, title, children }) => (
  <section style={{
    background: '#1e1e1e',
    padding: '2rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid #333'
  }}>
    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span> {title}
    </h2>
    {children}
  </section>
);

const Tutorial = () => {
  return (
    <div className="detail-view" style={{ paddingBottom: '4rem' }}>
      <h1>🧭 Interaktives Tutorial</h1>
      <p>Willkommen! Dieses Tutorial führt dich Schritt für Schritt durch alle Funktionen von ORDERLY.</p>

      <Abschnitt icon="📥" title="1. Bestellungen analysieren">
        <p>In der <strong>Bestellübersicht</strong> kannst du alle eingehenden Bestellungen, deren Status und geplante sowie tatsächliche Lieferdaten einsehen.</p>
        <p><Link to="/orderlog">➡️ Zu den Bestellungen</Link></p>
      </Abschnitt>

      <Abschnitt icon="📦" title="2. Lagerverlauf überwachen">
        <p>Wähle einen Lieferanten und dann einen Artikel aus, um den Verlauf von Lagerzugängen und -abgängen im Zeitverlauf zu sehen.</p>
        <p><Link to="/lager">➡️ Zum Lagerverlauf</Link></p>
      </Abschnitt>

      <Abschnitt icon="🔄" title="3. Retouren untersuchen">
        <p>Untersuche die Rückläufer nach Artikel, Menge und Grund – und erkenne mögliche Qualitätsprobleme oder Falschlieferungen.</p>
        <p><Link to="/retouren">➡️ Zu den Retouren</Link></p>
      </Abschnitt>

      <Abschnitt icon="⚠️" title="4. Engpässe identifizieren">
        <p>Erkenne aktuelle Engpässe anhand von kritischen Beständen – inklusive deren Beginn und verantwortlichem Lieferanten.</p>
        <p><Link to="/engpaesse">➡️ Zu den Engpässen</Link></p>
      </Abschnitt>

      <Abschnitt icon="💰" title="5. Finanzen analysieren">
        <p>Hier kannst du die monatlichen Ausgaben pro Kategorie und Lieferant einsehen. Behalte deine Budgets im Blick.</p>
        <p><Link to="/finanzen">➡️ Zu den Finanzen</Link></p>
      </Abschnitt>

      <Abschnitt icon="🌟" title="6. Lieferantenbewertung">
        <p>Bewerte deine Lieferanten nach Pünktlichkeit, Retourenquote, Lieferdauer und Anzahl an Engpässen.</p>
        <p><Link to="/bewertung">➡️ Zur Bewertung</Link></p>
      </Abschnitt>

      <Abschnitt icon="📎" title="So nutzt du dieses Tutorial live">
        <ul>
          <li>Teile einfach diesen Link mit deinem Team: <code>{window.location.origin}/tutorial</code></li>
          <li>Präsentiere live in einem Meeting – jeder kann es gleichzeitig mitklicken!</li>
        </ul>
        <p>💡 <em>Tipp: Öffne das Tutorial in einem eigenen Tab, um jederzeit darauf zurückzugreifen.</em></p>
      </Abschnitt>
    </div>
  );
};

export default Tutorial;
