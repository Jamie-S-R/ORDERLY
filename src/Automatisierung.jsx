import React from 'react';

const demoDaten = [
  {
    lieferant: 'Continental AG',
    artikel: 'Fahrradreifen Contact Urban',
    artikelnummer: 'CONT-URBAN',
    bestand: 17,
    letzteBestellung: '01.06.2024',
    bestellnummer: '#678241',
    lieferdatum: '02.08.2024',
    status: 'Bestellung generiert',
    progressText: 'Bestellung generiert',
    progressPercent: 20
  },
  {
    lieferant: 'SRAM Corporation',
    artikel: 'Kurbelgarnitur SX Eagle',
    artikelnummer: 'SRAM-SX',
    bestand: 3,
    letzteBestellung: '07.06.2024',
    bestellnummer: '#845221',
    lieferdatum: '06.08.2024',
    status: 'Preis validiert',
    progressText: 'Preis validiert',
    progressPercent: 60
  },
  {
    lieferant: 'Shimano GmbH',
    artikel: 'Kassette XT CS-M8100 12-fach',
    artikelnummer: 'SHIM-XT',
    bestand: 4,
    letzteBestellung: '15.07.2024',
    bestellnummer: '#952103',
    lieferdatum: '04.08.2024',
    status: 'Bestätigt',
    progressText: 'Bestätigt',
    progressPercent: 80
  }
];

const Automatisierung = () => {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', color: '#eee' }}>
      <h2 style={{ color: '#f7a440' }}>Automatisierte Bestellungen</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {demoDaten.map((eintrag, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '1.5rem',
              backgroundColor: '#1e1e1e',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <h3>{eintrag.lieferant}</h3>
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                border: '1px solid #444',
                borderRadius: '8px',
                backgroundColor: '#121212'
              }}
            >
              <strong style={{ fontSize: '1rem', color: '#fff' }}>
                {eintrag.artikel} <span style={{ color: '#aaa' }}>– {eintrag.artikelnummer}</span>
              </strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                <div>Bestand: <strong style={{ color: 'orangered' }}>{eintrag.bestand} Stück</strong></div>
                <div>Letzte Bestellung: {eintrag.letzteBestellung}</div>
                <div>Bestellnummer: {eintrag.bestellnummer}</div>
                <div>Lieferdatum: {eintrag.lieferdatum}</div>
                <div>Status: <span style={{
                  backgroundColor: '#f7a44022',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  color: '#f7a440'
                }}>{eintrag.status}</span></div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{eintrag.progressText}</div>
                <div style={{ background: '#333', borderRadius: '6px', height: '8px', marginTop: '4px' }}>
                  <div style={{
                    width: `${eintrag.progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(to right, #f7a440, #ffa726)',
                    borderRadius: '6px',
                    transition: 'width 0.4s ease'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Automatisierung;
