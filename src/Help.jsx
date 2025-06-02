import React from 'react';

const Help = () => {
  return (
    <div className="detail-view">
      <h2>❓ Hilfe & Support</h2>
      <p>
        Du brauchst Unterstützung bei der Nutzung von ORDERLY? Kein Problem!
      </p>
      <ul>
        <li>📖 Sieh dir das <strong><a href="/tutorial" className="section-link">Tutorial</a></strong> an, um alle Funktionen kennenzulernen.</li>
        <li>📬 Für technische Fragen oder Probleme kontaktiere uns gerne per Mail.</li>
        <li>🛠️ In der Pilotphase steht dir persönlicher Support zur Verfügung.</li>
      </ul>
      <p style={{ marginTop: '2rem', fontSize: '14px', color: '#ccc' }}>
        Kontakt: <a href="mailto:Jamie.Roesler@tuhh.de" className="email-link">Jamie Rösler</a>
      </p>
    </div>
  );
};

export default Help;
