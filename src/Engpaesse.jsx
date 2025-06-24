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

const AccordionSection = ({ title, children }) => (
  <section className="mb-6 border border-gray-600 rounded-lg overflow-hidden">
    <header className="p-3 bg-gray-700 text-white font-semibold cursor-pointer">
      ▼ {title}
    </header>
    <div className="p-4 bg-gray-800">{children}</div>
  </section>
);

const Engpaesse = ({ orders = [] }) => {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [zeigeVergangene, setZeigeVergangene] = useState(false);

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
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([lieferant, count]) => ({ lieferant, count }));
  }, [engpaesse]);

  const artikelStats = useMemo(() => {
    const map = {};
    filteredEngpaesse.forEach(r => {
      const art = r.Artikelnummer || 'Unbekannt';
      map[art] = (map[art] || 0) + 1;
    });
    return Object.entries(map).map(([artikel, count]) => ({ artikel, count }));
  }, [filteredEngpaesse]);

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">⚠️ Engpassanalyse</h2>
      <p className="text-gray-300 mb-4">Analyse kritischer Lagerengpässe zur Optimierung der Bestellstrategie.</p>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        <label className="flex items-center text-white">
          <input
            type="checkbox"
            checked={zeigeVergangene}
            onChange={e => setZeigeVergangene(e.target.checked)}
            className="mr-2"
          />
          Vergangene Engpässe anzeigen
        </label>
      </div>
      {engpaesse.length === 0 ? (
        <p className="text-gray-400">
          ✅ Keine aktuellen Engpässe vorhanden.
          {zeigeVergangene ? ' Auch keine vergangenen Engpässe gefunden.' : ''}
        </p>
      ) : (
        <>
          {!selectedSupplier && (
            <AccordionSection title="Anzahl Engpässe je Lieferant">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lieferantenStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="lieferant" stroke="#ccc" interval={0} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#f44336" name="Engpässe" />
                </BarChart>
              </ResponsiveContainer>
            </AccordionSection>
          )}
          {selectedSupplier && (
            <AccordionSection title="Engpässe nach Artikel">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={artikelStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="artikel" stroke="#ccc" interval={0} tick={{ fontSize: 12 }} height={60} />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="count" fill="#2196f3" name="Engpässe" />
                </BarChart>
              </ResponsiveContainer>
            </AccordionSection>
          )}
          <AccordionSection title="Engpässe im Detail">
            <ul className="order-list space-y-2">
              {filteredEngpaesse.map((r, i) => (
                <li key={i} className={`bg-gray-800 p-3 rounded-lg ${parseInt(r.AktuellerLagerbestand || 0) < 10 ? 'border-l-4 border-red-500' : ''}`}>
                  <strong className="text-[#f7a440]">{r.KritischSeit || 'Unbekannt'}</strong> – {r.Artikelbeschreibung} ({r.Artikelnummer}) – Lager: {r.AktuellerLagerbestand || 'n/a'}
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