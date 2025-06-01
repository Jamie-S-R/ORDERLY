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
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#4caf50', '#2196f3', '#ffc107', '#f44336', '#9c27b0', '#ff9800'];

const AccordionSection = ({ title, children }) => (
  <section style={{ marginBottom: '1.5rem', border: '1px solid #444', borderRadius: '6px' }}>
    <header
      style={{ padding: '0.8rem 1rem', background: '#333', color: '#fff' }}
    >
      <strong>▼ {title}</strong>
    </header>
    <div style={{ padding: '1rem', background: '#1e1e1e' }}>{children}</div>
  </section>
);

const Finanzen = () => {
  const [orders, setOrders] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');

  useEffect(() => {
    Papa.parse('/data/bestellungen.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const cleaned = results.data.filter(row =>
          row.BestellID &&
          !isNaN(parseFloat(row.Gesamtpreis)) &&
          !isNaN(parseInt(row.Lieferdauer))
        );
        setOrders(cleaned);
      }
    });
  }, []);

  const filteredOrders = useMemo(() => {
    return selectedSupplier
      ? orders.filter(o => o.Lieferant === selectedSupplier)
      : orders;
  }, [orders, selectedSupplier]);

  const lieferanten = useMemo(() => {
    return [...new Set(orders.map(o => o.Lieferant || 'Unbekannt'))];
  }, [orders]);

  const ausgabenProLieferant = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const name = o.Lieferant || 'Unbekannt';
      const betrag = parseFloat(o.Gesamtpreis || 0);
      map[name] = (map[name] || 0) + betrag;
    });
    return Object.entries(map).map(([lieferant, ausgabe]) => ({ lieferant, ausgabe: +ausgabe.toFixed(2) }));
  }, [orders]);

  const ausgabenProMonat = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const monat = o.JahrMonat || new Date(o.Bestelldatum).toISOString().slice(0, 7);
      const summe = parseFloat(o.Gesamtpreis || 0);
      map[monat] = (map[monat] || 0) + summe;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monat, ausgabe]) => ({ monat, ausgabe: +ausgabe.toFixed(2) }));
  }, [filteredOrders]);

  const ausgabenProKategorie = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const kategorie = o.Kategorie || 'Sonstiges';
      map[kategorie] = (map[kategorie] || 0) + parseFloat(o.Gesamtpreis || 0);
    });
    return Object.entries(map).map(([kategorie, summe]) => ({ kategorie, summe: +summe.toFixed(2) }));
  }, [filteredOrders]);

  const lieferdauerStats = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const name = o.Lieferant || 'Unbekannt';
      const tage = parseInt(o.Lieferdauer || 0);
      if (!map[name]) map[name] = { sum: 0, count: 0 };
      map[name].sum += tage;
      map[name].count += 1;
    });
    return Object.entries(map).map(([lieferant, { sum, count }]) => ({
      lieferant,
      ØLieferdauer: +(sum / count).toFixed(1)
    }));
  }, [filteredOrders]);

  return (
    <div className="detail-view">
      <h2>💰 Finanzanalyse</h2>

      {/* Lieferantenfilter */}
      <div style={{ marginBottom: '20px' }}>
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
      </div>

      {!selectedSupplier && (
        <AccordionSection title="1. Gesamtausgaben pro Lieferant">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ausgabenProLieferant}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="lieferant" stroke="#ccc" interval={0} angle={0} tick={{ fontSize: 12 }} />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Legend />
              <Bar dataKey="ausgabe" fill="#ff9800" name="Gesamtausgaben (€)" />
            </BarChart>
          </ResponsiveContainer>
        </AccordionSection>
      )}

      <AccordionSection title="2. Monatliche Ausgaben">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ausgabenProMonat}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="monat" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Legend />
            <Bar dataKey="ausgabe" fill="#4caf50" name="Monatliche Ausgaben (€)" />
          </BarChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="3. Ausgaben nach Kategorie">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={ausgabenProKategorie}
              dataKey="summe"
              nameKey="kategorie"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {ausgabenProKategorie.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="4. Durchschnittliche Lieferdauer pro Lieferant">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lieferdauerStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="lieferant" stroke="#ccc" interval={0} angle={0} tick={{ fontSize: 12 }} />
            <YAxis stroke="#ccc" label={{ value: "Tage", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ØLieferdauer" fill="#2196f3" name="Ø Lieferdauer (Tage)" />
          </BarChart>
        </ResponsiveContainer>
      </AccordionSection>

      <AccordionSection title="5. Bestellungen im Detail">
        <ul className="order-list">
          {filteredOrders.map((o, i) => (
            <li key={i}>
              <strong>{o.Bestelldatum}</strong> – {o.Artikelbeschreibung} ({o.Menge} × {parseFloat(o.PreisProEinheit).toFixed(2)} €) → <strong>{parseFloat(o.Gesamtpreis).toFixed(2)} €</strong><br />
              Lieferant: {o.Lieferant} | Kategorie: {o.Kategorie} | Lieferdauer: {o.Lieferdauer} Tage
            </li>
          ))}
        </ul>
      </AccordionSection>
    </div>
  );
};

export default Finanzen;
