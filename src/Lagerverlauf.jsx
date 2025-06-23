import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Lagerverlauf = ({ orders = [], outputs = [] }) => {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedArticle, setSelectedArticle] = useState('');

  const artikelMap = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (!map[o.Lieferant]) map[o.Lieferant] = new Set();
      map[o.Lieferant].add(o.Artikelbeschreibung);
    });
    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o =>
      (!selectedSupplier || o.Lieferant === selectedSupplier) &&
      (!selectedArticle || o.Artikelbeschreibung === selectedArticle)
    );
  }, [orders, selectedSupplier, selectedArticle]);

  const relevantArtikelnummern = useMemo(() => {
    const artikelnummern = new Set();
    filteredOrders.forEach(o => {
      if (o.Artikelnummer) artikelnummern.add(o.Artikelnummer);
    });
    return artikelnummern;
  }, [filteredOrders]);

  const filteredOutputs = useMemo(() => {
    return outputs.filter(o =>
      (!selectedArticle && relevantArtikelnummern.has(o.Artikelnummer)) ||
      (selectedArticle && o.Artikelnummer === orders.find(ord => ord.Artikelbeschreibung === selectedArticle)?.Artikelnummer)
    );
  }, [outputs, selectedArticle, relevantArtikelnummern, orders]);

  const monthlyData = useMemo(() => {
    const data = {};
    const formatMonth = (dateStr) => new Date(dateStr).toISOString().slice(0, 7);

    filteredOrders.forEach(o => {
      const month = formatMonth(o.Bestelldatum);
      if (!data[month]) data[month] = { month, zugang: 0, abgang: 0 };
      data[month].zugang += parseInt(o.Menge || 0);
    });

    filteredOutputs.forEach(a => {
      const month = formatMonth(a.Ausgangsdatum);
      if (!data[month]) data[month] = { month, zugang: 0, abgang: 0 };
      data[month].abgang += parseInt(a.VerbrauchteMenge || 0);
    });

    const sorted = Object.values(data).sort((a, b) => a.month.localeCompare(b.month));
    let bestand = 0;
    return sorted.map(d => {
      bestand += (d.zugang || 0) - (d.abgang || 0);
      return { ...d, bestand };
    });
  }, [filteredOrders, filteredOutputs]);

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">📦 Lagerbestandsverlauf</h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={selectedSupplier}
          onChange={e => {
            setSelectedSupplier(e.target.value);
            setSelectedArticle('');
          }}
          className="p-2 bg-gray-700 text-white rounded-lg"
        >
          <option value="">Lieferant wählen</option>
          {[...new Set(orders.map(o => o.Lieferant))].map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={selectedArticle}
          onChange={e => setSelectedArticle(e.target.value)}
          disabled={!selectedSupplier}
          className="p-2 bg-gray-700 text-white rounded-lg"
        >
          <option value="">Artikel wählen</option>
          {[...(artikelMap[selectedSupplier] || [])].map((a, i) => (
            <option key={i} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="month" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
          <Legend />
          <Bar dataKey="zugang" stackId="a" fill="#4caf50" name="Bestellungen" />
          <Bar dataKey="abgang" stackId="a" fill="#f44336" name="Ausgänge" />
          <Bar dataKey="bestand" fill="#2196f3" name="Lagerbestand" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Lagerverlauf;