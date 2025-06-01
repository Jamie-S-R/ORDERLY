import React, { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

const AccordionSection = ({ title, children }) => (
  <section style={{ marginBottom: '1.5rem', border: '1px solid #444', borderRadius: '6px' }}>
    <header style={{ padding: '0.8rem 1rem', background: '#333', color: '#fff' }}>
      <strong>▼ {title}</strong>
    </header>
    <div style={{ padding: '1rem', background: '#1e1e1e' }}>{children}</div>
  </section>
);

const Lieferantenbewertung = () => {
  const [orders, setOrders] = useState([]);
  const [retouren, setRetouren] = useState([]);

  useEffect(() => {
    Papa.parse('/data/bestellungen.csv', {
      download: true,
      header: true,
      complete: (results) => {
        setOrders(results.data.filter(r => r.BestellID));
      }
    });
    Papa.parse('/data/retouren.csv', {
      download: true,
      header: true,
      complete: (results) => {
        setRetouren(results.data.filter(r => r.RetoureID));
      }
    });
  }, []);

  const lieferanten = useMemo(() => {
    return [...new Set(orders.map(o => o.Lieferant).filter(Boolean))];
  }, [orders]);

  const bewertungen = useMemo(() => {
    const map = {};

    lieferanten.forEach(lieferant => {
      const relevantOrders = orders.filter(o => o.Lieferant === lieferant);
      const relevantRetouren = retouren.filter(r => r.Lieferant === lieferant);
      const total = relevantOrders.length;
      const puenktlich = relevantOrders.filter(o => o.TatsächlichesLieferdatum <= o.GeplantesLieferdatum).length;
      const avgLieferdauer = relevantOrders.reduce((acc, o) => acc + parseInt(o.Lieferdauer || 0), 0) / total;
      const engpaesse = relevantOrders.filter(o => o.Engpass === 'True').length;

      map[lieferant] = {
        lieferant,
        puenktlichkeit: total > 0 ? (puenktlich / total * 100).toFixed(1) : 0,
        lieferdauer: avgLieferdauer.toFixed(1),
        retouren: relevantRetouren.length,
        engpaesse
      };
    });

    return Object.values(map);
  }, [orders, retouren, lieferanten]);

  return (
    <div className="detail-view">
      <h2>📈 Lieferantenbewertung</h2>

      <AccordionSection title="Radar-Diagramm: Vergleich">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={bewertungen}>
            <PolarGrid />
            <PolarAngleAxis dataKey="lieferant" />
            <PolarRadiusAxis />
            <Radar name="Pünktlichkeit (%)" dataKey="puenktlichkeit" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
            <Radar name="Engpässe" dataKey="engpaesse" stroke="#f44336" fill="#f44336" fillOpacity={0.3} />
            <Radar name="Retouren" dataKey="retouren" stroke="#ff9800" fill="#ff9800" fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="Durchschnittliche Lieferdauer">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bewertungen}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="lieferant" stroke="#ccc" interval={0} tick={{ fontSize: 12 }} />
            <YAxis label={{ value: 'Tage', angle: -90, position: 'insideLeft' }} stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Bar dataKey="lieferdauer" fill="#2196f3" name="Ø Lieferdauer (Tage)" />
          </BarChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="Detailtabelle">
        <table style={{ width: '100%', color: '#ccc', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #555' }}>Lieferant</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #555' }}>Pünktlich (%)</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #555' }}>Ø Lieferdauer</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #555' }}>Retouren</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #555' }}>Engpässe</th>
            </tr>
          </thead>
          <tbody>
            {bewertungen.map((b, i) => (
              <tr key={i}>
                <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{b.lieferant}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{b.puenktlichkeit}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{b.lieferdauer}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{b.retouren}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{b.engpaesse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AccordionSection>
    </div>
  );
};

export default Lieferantenbewertung;
