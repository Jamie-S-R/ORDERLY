import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
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

// Supabase-Client initialisieren
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AccordionSection = ({ title, children }) => (
  <section className="mb-6 border border-gray-600 rounded-lg overflow-hidden">
    <header className="p-3 bg-gray-700 text-white font-semibold cursor-pointer">
      ▼ {title}
    </header>
    <div className="p-4 bg-gray-800">{children}</div>
  </section>
);

const Retouren = () => {
  const [retouren, setRetouren] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Daten aus Supabase abrufen
  useEffect(() => {
    const fetchRetouren = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('retouren')
          .select('*');
        if (error) throw error;
        setRetouren(data);
      } catch (err) {
        setError('Fehler beim Abrufen der Retouren: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRetouren();
  }, []);

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

  const returnReasons = filteredRetouren.map(r => r.GrundDerRetoure || 'Unbekannt');
  const reasonStats = returnReasons.reduce((acc, reason) => {
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});
  const reasonData = Object.entries(reasonStats).map(([reason, count]) => ({ reason, count }));

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">📦 Retourenanalyse</h2>
      <p className="text-gray-300 mb-4">Übersicht über Rückläufer zur Optimierung von Bestellprozessen.</p>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {isLoading && <p className="text-yellow-500 text-center mb-4">Lade Retouren...</p>}
      <div className="mb-6">
        <label className="flex items-center text-white">
          Lieferant:
          <select
            value={selectedSupplier}
            onChange={e => setSelectedSupplier(e.target.value)}
            className="ml-2 p-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-[#f7a440]"
          >
            <option value="">Alle</option>
            {lieferanten.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {!selectedSupplier && (
        <AccordionSection title="Anzahl Retouren je Lieferant">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lieferantenStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="lieferant" stroke="#ccc" interval={0} tick={{ fontSize: 12 }} />
              <YAxis stroke="#ccc" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
              <Legend />
              <Bar dataKey="count" fill="#ff9800" name="Retouren" />
            </BarChart>
          </ResponsiveContainer>
        </AccordionSection>
      )}
      {selectedSupplier && (
        <AccordionSection title="Retouren nach Artikel">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={artikelStats} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="artikel"
                stroke="#ccc"
                interval={0}
                tick={{ fontSize: 12 }}
                height={60}
              />
              <YAxis stroke="#ccc" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
              <Legend />
              <Bar dataKey="count" fill="#4caf50" name="Retouren" />
            </BarChart>
          </ResponsiveContainer>
        </AccordionSection>
      )}
      <AccordionSection title="Häufigste Retourengründe">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reasonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="reason" stroke="#ccc" interval={0} tick={{ fontSize: 12 }} />
            <YAxis stroke="#ccc" />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
            <Legend />
            <Bar dataKey="count" fill="#f44336" name="Anzahl Retouren" />
          </BarChart>
        </ResponsiveContainer>
      </AccordionSection>
      <AccordionSection title="Rückläufer im Detail">
        <ul className="order-list space-y-2">
          {filteredRetouren.map((r, i) => (
            <li key={i} className="bg-gray-800 p-3 rounded-lg">
              <strong className="text-[#f7a440]">{r.Datum}</strong> – {r.Artikelnummer} – {r.Menge} Stück<br />
              <em className="text-gray-400">{r.GrundDerRetoure}</em>
            </li>
          ))}
        </ul>
      </AccordionSection>
    </div>
  );
};

export default Retouren;