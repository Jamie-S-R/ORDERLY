import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
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

const AccordionSection = ({ title, children }) => (
  <section style={{ marginBottom: '1.5rem', border: '1px solid #444', borderRadius: '6px' }}>
    <header style={{ padding: '0.8rem 1rem', background: '#333', color: '#fff' }}>
      <strong>▼ {title}</strong>
    </header>
    <div style={{ padding: '1rem', background: '#1e1e1e' }}>
      {children}
    </div>
  </section>
);

const Engpaesse = () => {
  const [orders, setOrders] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [zeigeVergangene, setZeigeVergangene] = useState(false);

  useEffect(() => {
    Papa.parse('/data/bestellungen.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const cleaned = results.data.filter(r => r.BestellID);
        setOrders(cleaned);
      }
    });
  }, []);

  const aktuelleMonate = useMemo(() => {
    const now = new Date();
    const curr = now.toISOString().slice(0, 7);
    const last = new Date(now.setMonth(now.getMonth() - 1)).toISOString().slice(0, 7);
    return [curr, last];
  }, []);

  const engpaesse = useMemo(() => {
    return orders.filter(r =>
      (r.Engpass === 'True' || r.Engpass === true) &&
      (zeigeVergangene || (r.KritischSeit && aktuelleMonate.includes(r.KritischSeit.slice(0, 7))))
    );
  }, [orders, zeigeVergangene, aktuelleMonate]);

  const filteredEngpaesse = useMemo(() => {
    return selectedSupplier
      ? engpaesse.filter(r => r.Lieferant === selectedSupplier)
      : engpaesse;
  }, [engpaesse, selectedSupplier]);

  const lieferanten = useMemo(() => {
    return [...new Set(engpaesse.map(r => r.Lieferant || 'Unbekannt'))];
  }, [engpaesse]);

  const lieferantenStats = useMemo(() => {
    const map = {};
    engpaesse.forEach(r => {
      const name = r.Lieferant || 'Unbekannt';
      if (!map[name]) map[name] = 0;
      map[name] += 1;
    });
    return Object.entries(map).map(([lieferant, count]) => ({ lieferant, count }));
  }, [engpaesse]);

  const artikelStats = useMemo(() => {
    const map = {};
    filteredEngpaesse.forEach(r => {
      const art = r.Artikelnummer || 'Unbekannt';
      if (!map[art]) map[art] = 0;
      map[art] += 1;
    });
    return Object.entries(map).map(([artikel, count]) => ({ artikel, count }));
  }, [filteredEngpaesse]);

  return (
    <div className="detail-view">
      <h2>⚠️ Engpassanalyse</h2>
      <p>Analyse kritischer Lagerengpässe</p>

      {/* Filter & Optionen */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <label>
          Lieferant:&nbsp;
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

        <label>
          <input
            type="checkbox"
            checked={zeigeVergangene}
            onChange={e => setZeigeVergangene(e.target.checked)}
          />
          &nbsp;Vergangene Engpässe anzeigen
        </label>
      </div>

      {/* Anzeige, falls keine Daten */}
      {engpaesse.length === 0 ? (
        <p style={{ color: '#aaa' }}>
          ✅ Keine aktuellen Engpässe vorhanden.
          {zeigeVergangene ? ' Auch keine vergangenen Engpässe in den Daten gefunden.' : ''}
        </p>
      ) : (
        <>
          {/* Diagramm je Lieferant */}
          {!selectedSupplier && (
            <AccordionSection title="Anzahl Engpässe je Lieferant">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lieferantenStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="lieferant" stroke="#ccc" interval={0} angle={0} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#ccc" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#f44336" name="Engpässe" />
                </BarChart>
              </ResponsiveContainer>
            </AccordionSection>
          )}

          {/* Diagramm nach Artikel */}
          {selectedSupplier && (
            <AccordionSection title="Engpässe nach Artikel">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={artikelStats}>
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
                  <Bar dataKey="count" fill="#2196f3" name="Engpässe" />
                </BarChart>
              </ResponsiveContainer>
            </AccordionSection>
          )}

          {/* Detailansicht */}
          <AccordionSection title="Engpässe im Detail">
            <ul className="order-list">
              {filteredEngpaesse.map((r, i) => (
                <li key={i}>
                  <strong>{r.KritischSeit || 'Unbekannt'}</strong> – {r.Artikelbeschreibung} ({r.Artikelnummer}) – Lager: {r.AktuellerLagerbestand || 'n/a'}
                </li>
              ))}
            </ul>
          </AccordionSection>
        </>
      )}
    </div>
  );
};

export default Engpaesse;
