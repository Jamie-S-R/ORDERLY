import React from 'react';

const AutomatisierungPreview = () => {
  const eintrag = {
    lieferant: 'Shimano GmbH',
    artikel: 'Kassette XT CS-M8100 12-fach',
    menge: '151 Stück',
    status: 'Bestellung übermittelt',
    lieferdatum: '06.06.2025',
    artikelnummer: 'SHI-M8100',
  };

  return (
    <div style={{
      fontSize: '0.85rem',
      color: '#ddd',
      lineHeight: '1.5',
      padding: '0.5rem',
    }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong style={{ color: '#f7a440' }}>{eintrag.lieferant}</strong><br />
        <span>{eintrag.artikel} ({eintrag.artikelnummer})</span><br />
        <span style={{ color: '#bbb' }}>Menge: {eintrag.menge}</span><br />
        <span style={{ color: '#bbb' }}>Status: {eintrag.status}</span><br />
        <span style={{ color: '#888' }}>Voraussichtliche Lieferung: {eintrag.lieferdatum}</span>
      </div>
    </div>
  );
};

export default AutomatisierungPreview;
