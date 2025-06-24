import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Offen ab Start
const AccordionSection = ({ title, children }) => {
  return (
    <section style={{ marginBottom: '1.5rem', border: '1px solid #444', borderRadius: '6px' }}>
      <header
        style={{ padding: '0.8rem 1rem', background: '#333', color: '#fff' }}
      >
        <strong>▼ {title}</strong>
      </header>
      <div style={{ padding: '1rem', background: '#1e1e1e' }}>
        {children}
      </div>
    </section>
  );
};

// Direkt eingebettete CSV-Daten
const retourenData = [
  { RetoureID: '5000', Datum: '2023-09-18', Artikelnummer: 'MA-RT-MDR-P', GrundDerRetoure: 'Qualitätsmängel', Menge: '16', Lieferant: 'Magura Bosch Parts & Services GmbH' },
  { RetoureID: '5001', Datum: '2023-03-01', Artikelnummer: 'SI-KI-STORIA', GrundDerRetoure: 'Qualitätsmängel', Menge: '19', Lieferant: 'Selle Italia S.r.l.' },
  { RetoureID: '5002', Datum: '2024-01-14', Artikelnummer: 'SH-BR-M820', GrundDerRetoure: 'Falscher Artikel geliefert', Menge: '30', Lieferant: 'Shimano GmbH' },
  // Weitere Daten hier einfügen...
];

const Retouren = () => {
  const [retouren, setRetouren] = useState(retourenData);
  const [selectedSupplier, setSelectedSupplier] = useState('');

  const filteredRetouren = useMemo(() => {
    return selectedSupplier
      ? retouren.filter(r => r.Lieferant === selectedSupplier)
      : retouren;
  }, [retouren, selectedSupplier]);

  const lieferanten = useMemo(() => {
    return [...new Set(retouren.map(r => r.Lieferant || 'Unbekannt'))];
  }, [retouren]);

  const lieferantenStats = useMemo(() => {
    const map = {};
    retouren.forEach(r => {
      const name = r.Lieferant || 'Unbekannt';
      if (!map[name]) map[name] = 0;
      map[name] += 1;
    });
    return Object.entries(map).map(([lieferant, count]) => ({ lieferant, count }));
  }, [retouren]);

  const artikelStats = useMemo(() => {
    const map = {};
    filteredRetouren.forEach(r => {
      const art = r.Artikelnummer || 'Unbekannt';
      if (!map[art]) map[art] = 0;
      map[art] += 1;
    });
    return Object.entries(map).map(([artikel, count]) => ({ artikel, count }));
  }, [filteredRetouren]);

  return (
    <div className="detail-view">
      <h2>📦 Retourenanalyse</h2>

      {/* Lieferantenauswahl */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Lieferant: 
          <select
            value={selectedSupplier}
            onChange={e => setSelectedSupplier(e.target.value)}
          >
            <option value="">Alle</option>
            {lieferanten.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Charts und Daten */}
      {!selectedSupplier && (
        <AccordionSection title="Anzahl Retouren je Lieferant">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lieferantenStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="lieferant" stroke="#ccc" interval={0} angle={0} tick={{ fontSize: 12 }} />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ff9800" name="Retouren" />
            </BarChart>
          </ResponsiveContainer>
        </AccordionSection>
      )}

      {selectedSupplier && (
        <>
          <AccordionSection title="Retouren nach Artikel">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={artikelStats} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="artikel"
                  stroke="#ccc"
                  interval={0}
                  angle={0}
                  tick={{ fontSize: 12 }}
                  height={60}
                />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4caf50" name="Retouren" />
              </BarChart>
            </ResponsiveContainer>
          </AccordionSection>
        </>
      )}

      <AccordionSection title="Rückläufer im Detail">
        <ul className="order-list">
          {filteredRetouren.map((r, i) => (
            <li key={i}>
              <strong>{r.Datum}</strong> – {r.Artikelnummer} – {r.Menge} Stück<br />
              <em>{r.GrundDerRetoure}</em>
            </li>
          ))}
        </ul>
      </AccordionSection>
    </div>
  );
};

export default Retouren;