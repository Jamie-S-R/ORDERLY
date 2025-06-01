import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    title: "Bestellungen",
    description: "Überwache alle eingehenden Bestellungen inklusive Lieferstatus, Mengen und Lieferterminen.",
    link: "/orderlog",
    note: "Filtern nach Lieferant oder Artikelnummer möglich."
  },
  {
    title: "Lagerverlauf",
    description: "Analysiere die Bestandsentwicklung über Zeit – basierend auf Bestellungen und Ausgängen.",
    link: "/lager",
    note: "Filtere nach Lieferant und Artikel für gezielte Auswertungen."
  },
  {
    title: "Retouren",
    description: "Betrachte Rückläufer nach Artikel, Menge und Rücksendegrund.",
    link: "/retouren",
    note: "Wähle einen Lieferanten für detaillierte Einblicke."
  },
  {
    title: "Engpässe",
    description: "Identifiziere kritische Lagerbestände und Engpassentwicklungen.",
    link: "/engpaesse",
    note: "Nur aktuelle Engpässe werden standardmäßig angezeigt."
  },
  {
    title: "Finanzen",
    description: "Visualisiere monatliche Kosten nach Lieferant und Kategorie.",
    link: "/finanzen",
    note: "Ideal für Kostenkontrolle und Budgetplanung."
  },
  {
    title: "Lieferantenbewertung",
    description: "Vergleiche Lieferanten objektiv auf Basis von Zuverlässigkeit, Rückläufern und Lieferdauer.",
    link: "/bewertung",
    note: "Metriken werden in Scores übersetzt für klare Vergleichbarkeit."
  }
];

const Tutorial = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const step = steps[stepIndex];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(prev => prev - 1);
  };

  return (
    <div className="detail-view" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Tutorial – Funktionen im Überblick</h1>
      <p style={{ marginBottom: '2rem' }}>
        Dieses Tutorial führt Schritt für Schritt durch alle Bereiche des Systems. Ideal für neue Nutzer oder zur Live-Präsentation.
      </p>

      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>{step.title}</h2>
        <p style={{ marginBottom: '1rem' }}>{step.description}</p>
        <p style={{ fontStyle: 'italic', color: '#aaa' }}>{step.note}</p>
        <button
          onClick={() => navigate(step.link)}
          style={{
            marginTop: '1.5rem',
            backgroundColor: '#ff9800',
            color: '#000',
            padding: '0.6rem 1.2rem',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Funktion öffnen
        </button>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={handlePrev}
          disabled={stepIndex === 0}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#333',
            color: '#ccc',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: stepIndex === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Zurück
        </button>
        <span style={{ color: '#888' }}>
          Schritt {stepIndex + 1} von {steps.length}
        </span>
        <button
          onClick={handleNext}
          disabled={stepIndex === steps.length - 1}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#333',
            color: '#ccc',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: stepIndex === steps.length - 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Weiter
        </button>
      </div>
    </div>
  );
};

export default Tutorial;
